import type { Layout } from 'react-grid-layout';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { safeJSONStorage } from '@/lib/safeStorage';

import type { ExchangeChartConfig } from '../panels/shared/settings/config';
import type { DashboardGroup, DashboardPanelLayout, DashboardPanelType } from './panelTypes';
import type { DashboardPersistedState } from './persistence';

import { cleanupPanel, createDefaultDashboardPanels, layoutForPanel } from './panelRegistry';
import { DEFAULT_GROUP_ID } from './panelTypes';
import { DASHBOARD_PERSISTENCE_VERSION, normalizeDashboardPersistence } from './persistence';

const createDefaultGroup = (panelIds: string[]): DashboardGroup => ({
    id: DEFAULT_GROUP_ID,
    name: 'Default',
    panelIds,
});

const defaultDashboard = createDefaultDashboardPanels();

const defaultPersistedState: DashboardPersistedState = {
    activeGroupId: DEFAULT_GROUP_ID,
    groups: [createDefaultGroup(defaultDashboard.panels.map((panel) => panel.id))],
    panels: defaultDashboard.panels,
    savedGridLayouts: defaultDashboard.savedGridLayouts,
};

export interface DashboardStore extends DashboardPersistedState {
    addPanelToGroup: (type: DashboardPanelType, groupId?: string) => string;
    createGroup: (name: string) => string;
    deleteGroup: (groupId: string) => Promise<void>;
    handleLayoutChange: (layouts: Layout[]) => void;
    removePanel: (id: string) => Promise<void>;
    renameGroup: (groupId: string, name: string) => void;
    setActiveGroup: (groupId: string) => void;
    setChartExchange: (panelId: string, exchange: string) => void;
    updateExchangeConfig: (panelId: string, exchange: string, config: ExchangeChartConfig) => void;
}

const useDashboardStore = create<DashboardStore>()(
    persist(
        (set, get) => ({
            ...defaultPersistedState,
            addPanelToGroup: (type, groupId) => {
                const id = crypto.randomUUID();
                set((state) => {
                    const targetGroupId = groupId ?? state.activeGroupId;
                    const targetGroup = state.groups.find((group) => group.id === targetGroupId);
                    if (!targetGroup) return state;

                    const y = targetGroup.panelIds.reduce((bottom, panelId) => {
                        const panel = state.panels.find((candidate) => candidate.id === panelId);
                        if (!panel) return bottom;
                        const layout =
                            state.savedGridLayouts[panelId]?.layout ?? layoutForPanel(panel.type, panelId, bottom);
                        return Math.max(bottom, layout.y + layout.h);
                    }, 0);

                    return {
                        panels: [...state.panels, { id, type }],
                        groups: state.groups.map((group) =>
                            group.id === targetGroupId ? { ...group, panelIds: [...group.panelIds, id] } : group,
                        ),
                        savedGridLayouts: {
                            ...state.savedGridLayouts,
                            [id]: { layout: layoutForPanel(type, id, y) },
                        },
                    };
                });
                return id;
            },
            createGroup: (name) => {
                const groupId = crypto.randomUUID();
                set((state) => ({
                    groups: [...state.groups, { id: groupId, name, panelIds: [] }],
                    activeGroupId: groupId,
                }));
                return groupId;
            },
            deleteGroup: async (groupId) => {
                if (groupId === DEFAULT_GROUP_ID) return;
                const state = get();
                const group = state.groups.find((candidate) => candidate.id === groupId);
                if (!group) return;

                const removedPanels = state.panels.filter((panel) => group.panelIds.includes(panel.id));
                const removedPanelIds = new Set(removedPanels.map((panel) => panel.id));

                set((current) => {
                    const savedGridLayouts = { ...current.savedGridLayouts };
                    for (const panelId of removedPanelIds) delete savedGridLayouts[panelId];
                    return {
                        panels: current.panels.filter((panel) => !removedPanelIds.has(panel.id)),
                        groups: current.groups.filter((candidate) => candidate.id !== groupId),
                        savedGridLayouts,
                        activeGroupId: current.activeGroupId === groupId ? DEFAULT_GROUP_ID : current.activeGroupId,
                    };
                });

                await Promise.all(removedPanels.map((panel) => cleanupPanel(panel.type, panel.id)));
            },
            handleLayoutChange: (layouts) => {
                set((state) => {
                    const savedGridLayouts = { ...state.savedGridLayouts };
                    for (const item of layouts) {
                        const { h, i, w, x, y } = item;
                        savedGridLayouts[i] = {
                            ...savedGridLayouts[i],
                            layout: { h, i, w, x, y },
                        };
                    }
                    return { savedGridLayouts };
                });
            },
            removePanel: async (id) => {
                const panel = get().panels.find((candidate) => candidate.id === id);
                if (!panel) return;

                set((state) => {
                    const { [id]: _removed, ...savedGridLayouts } = state.savedGridLayouts;
                    return {
                        panels: state.panels.filter((candidate) => candidate.id !== id),
                        groups: state.groups.map((group) => ({
                            ...group,
                            panelIds: group.panelIds.filter((panelId) => panelId !== id),
                        })),
                        savedGridLayouts,
                    };
                });

                await cleanupPanel(panel.type, id);
            },
            renameGroup: (groupId, name) => {
                set((state) => ({
                    groups: state.groups.map((group) => (group.id === groupId ? { ...group, name } : group)),
                }));
            },
            setActiveGroup: (groupId) => {
                if (get().groups.some((group) => group.id === groupId)) set({ activeGroupId: groupId });
            },
            setChartExchange: (panelId, exchange) => {
                set((state) => ({
                    savedGridLayouts: {
                        ...state.savedGridLayouts,
                        [panelId]: {
                            ...state.savedGridLayouts[panelId],
                            exchange,
                        },
                    },
                }));
            },
            updateExchangeConfig: (panelId, exchange, config) => {
                set((state) => {
                    const currentLayout: DashboardPanelLayout = state.savedGridLayouts[panelId] || {};
                    const currentExchangeConfigs = currentLayout.exchangeConfigs || {};
                    const currentExchangeConfig = currentExchangeConfigs[exchange] || {};

                    return {
                        savedGridLayouts: {
                            ...state.savedGridLayouts,
                            [panelId]: {
                                ...currentLayout,
                                exchangeConfigs: {
                                    ...currentExchangeConfigs,
                                    [exchange]: {
                                        ...currentExchangeConfig,
                                        ...config,
                                    },
                                },
                            },
                        },
                    };
                });
            },
        }),
        {
            name: 'dashboard-layout',
            storage: safeJSONStorage(),
            version: DASHBOARD_PERSISTENCE_VERSION,
            migrate: (persistedState) => normalizeDashboardPersistence(persistedState, defaultPersistedState),
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...normalizeDashboardPersistence(persistedState, defaultPersistedState),
            }),
            partialize: ({ activeGroupId, groups, panels, savedGridLayouts }) => ({
                activeGroupId,
                groups,
                panels,
                savedGridLayouts,
            }),
        },
    ),
);

export default useDashboardStore;
