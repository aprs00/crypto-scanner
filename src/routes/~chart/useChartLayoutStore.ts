import { type Layout } from 'react-grid-layout';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { safeJSONStorage } from '@/lib/safeStorage';

import { PanelType, type PanelItem } from './types';

export type SavedLayout = Pick<Layout, 'x' | 'y' | 'w' | 'h' | 'i'>;

export interface PanelTemplate {
    layout: Omit<SavedLayout, 'i'>;
}

export const panelTemplates: Record<PanelType, PanelTemplate> = {
    [PanelType.TradingView]: { layout: { h: 15, w: 12, x: 0, y: 0 } },
    [PanelType.OrderBook]: { layout: { h: 14, w: 5, x: 0, y: 16 } },
    [PanelType.Depth]: { layout: { h: 14, w: 4, x: 5, y: 16 } },
    [PanelType.Tape]: { layout: { h: 14, w: 3, x: 9, y: 16 } },
    [PanelType.Tick]: { layout: { h: 16, w: 12, x: 0, y: 30 } },
};

const makePanel = (type: PanelType): PanelItem => ({ id: crypto.randomUUID(), type });

const makeDefaults = (): PanelItem[] => [
    makePanel(PanelType.TradingView),
    makePanel(PanelType.OrderBook),
    makePanel(PanelType.Depth),
    makePanel(PanelType.Tape),
    makePanel(PanelType.Tick),
];

export interface ChartLayoutStore {
    panels: PanelItem[];
    savedGridLayouts: Record<string, SavedLayout>;
    addPanel: (type: PanelType) => string;
    removePanel: (id: string) => void;
    handleLayoutChange: (layouts: Layout[]) => void;
}

const useChartLayoutStore = create<ChartLayoutStore>()(
    persist(
        (set) => ({
            panels: makeDefaults(),
            savedGridLayouts: {},
            addPanel: (type) => {
                const panel = makePanel(type);
                set((state) => ({ panels: [...state.panels, panel] }));
                return panel.id;
            },
            removePanel: (id) => {
                set((state) => {
                    const { [id]: _removed, ...rest } = state.savedGridLayouts;
                    return {
                        panels: state.panels.filter((p) => p.id !== id),
                        savedGridLayouts: rest,
                    };
                });
            },
            handleLayoutChange: (layouts: Layout[]) => {
                set((state) => {
                    const next = { ...state.savedGridLayouts };
                    for (const item of layouts) {
                        const { i, x, y, w, h } = item;
                        next[i] = { i, x, y, w, h };
                    }
                    return { savedGridLayouts: next };
                });
            },
        }),
        {
            name: 'chart-page-layout',
            version: 3,
            storage: safeJSONStorage(),
            // v3 added a full-row tick chart to the defaults — backfill it for
            // existing users whose persisted layout predates it.
            migrate: (persisted, version) => {
                const state = persisted as ChartLayoutStore;
                if (version < 3 && !state.panels?.some((p) => p.type === PanelType.Tick)) {
                    state.panels = [...(state.panels ?? []), makePanel(PanelType.Tick)];
                }
                return state;
            },
        },
    ),
);

export default useChartLayoutStore;
