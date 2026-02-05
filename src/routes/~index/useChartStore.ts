import { type Layout } from 'react-grid-layout';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
    ChartType,
    DEFAULT_GROUP_ID,
    type ChartGroup,
    type ChartItem,
    type ChartTemplate,
    type ExchangeChartConfig,
    type GridLayout,
} from './types';

export const CHART_HEIGHT = 25;

export const chartTemplates: Record<ChartType, ChartTemplate> = {
    [ChartType.BetaHeatmap]: {
        gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: 0, i: '1' },
    },
    [ChartType.CorrelationPairHistory]: {
        gridLayout: { h: 12, w: 12, x: 0, y: CHART_HEIGHT, i: '2' },
    },
    [ChartType.CointegrationPairHistory]: {
        gridLayout: { h: 14, w: 12, x: 0, y: CHART_HEIGHT + 12, i: '2b' },
    },
    [ChartType.Scatter]: {
        gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 2, i: '3' },
    },
    [ChartType.Scatter3D]: {
        gridLayout: { h: 20, w: 12, x: 0, y: CHART_HEIGHT * 3, i: '4' },
    },
    [ChartType.ZScoreHeatmap]: {
        gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 4, i: '5' },
    },
    [ChartType.PriceChangePercentageDay]: {
        gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 5, i: '6' },
    },
    [ChartType.PriceChangePercentageHour]: {
        gridLayout: { h: 20, w: 12, x: 0, y: CHART_HEIGHT * 6, i: '7' },
    },
    [ChartType.CointegrationLiveTable]: {
        gridLayout: { h: 20, w: 12, x: 0, y: CHART_HEIGHT * 7, i: '8' },
    },
};

export interface ChartStore {
    chartIds: ChartItem[];
    savedGridLayouts: Record<string, GridLayout>;
    groups: ChartGroup[];
    activeGroupId: string;
    removeChart: (id: string, type: ChartType) => void;
    saveGridLayout: (key: string, layout: Layout) => void;
    handleLayoutChange: (layouts: Layout[]) => void;
    setChartExchange: (chartId: string, exchange: string) => void;
    updateExchangeConfig: (chartId: string, exchange: string, config: ExchangeChartConfig) => void;
    setActiveGroup: (groupId: string) => void;
    createGroup: (name: string) => string;
    renameGroup: (groupId: string, name: string) => void;
    deleteGroup: (groupId: string) => void;
    addChartToGroup: (type: ChartType, groupId?: string) => void;
}

const getDefaultChartIds = () => [
    { type: ChartType.BetaHeatmap, id: crypto.randomUUID() },
    { type: ChartType.CorrelationPairHistory, id: crypto.randomUUID() },
    { type: ChartType.CointegrationLiveTable, id: crypto.randomUUID() },
    { type: ChartType.Scatter, id: crypto.randomUUID() },
    { type: ChartType.Scatter3D, id: crypto.randomUUID() },
    { type: ChartType.ZScoreHeatmap, id: crypto.randomUUID() },
    { type: ChartType.PriceChangePercentageDay, id: crypto.randomUUID() },
    { type: ChartType.PriceChangePercentageHour, id: crypto.randomUUID() },
];

const createDefaultGroup = (chartIds: string[]): ChartGroup => ({
    id: DEFAULT_GROUP_ID,
    name: 'Default',
    chartIds,
});

const initialDefaultCharts = getDefaultChartIds();

const useChartStore = create<ChartStore>()(
    persist(
        (set, get) => ({
            chartIds: initialDefaultCharts,
            savedGridLayouts: {},
            groups: [createDefaultGroup(initialDefaultCharts.map((c) => c.id))],
            activeGroupId: DEFAULT_GROUP_ID,
            removeChart: (id) => {
                set((state) => {
                    const newChartIds = state.chartIds.filter((chart) => chart.id !== id);

                    const updatedGroups = state.groups.map((group) => ({
                        ...group,
                        chartIds: group.chartIds.filter((chartId) => chartId !== id),
                    }));

                    const { [id]: _, ...remainingLayouts } = state.savedGridLayouts;

                    return {
                        chartIds: newChartIds,
                        groups: updatedGroups,
                        savedGridLayouts: remainingLayouts,
                    };
                });
            },
            saveGridLayout: (key, layout) => {
                set((state) => ({
                    savedGridLayouts: {
                        ...state.savedGridLayouts,
                        [key]: {
                            ...state.savedGridLayouts[key],
                            layout,
                        },
                    },
                }));
            },
            handleLayoutChange: (layouts: Layout[]) => {
                const state = get();

                layouts.forEach((item) => {
                    const { i, x, y, w, h } = item;
                    state.saveGridLayout(i, { x, y, w, h, i });
                });
            },
            setChartExchange: (chartId: string, exchange: string) => {
                set((state) => {
                    const currentLayout = state.savedGridLayouts[chartId] || {};
                    return {
                        savedGridLayouts: {
                            ...state.savedGridLayouts,
                            [chartId]: {
                                ...currentLayout,
                                exchange,
                            },
                        },
                    };
                });
            },
            updateExchangeConfig: (chartId: string, exchange: string, config: ExchangeChartConfig) => {
                set((state) => {
                    const currentLayout = state.savedGridLayouts[chartId] || {};
                    const currentExchangeConfigs = currentLayout.exchangeConfigs || {};
                    const currentExchangeConfig = currentExchangeConfigs[exchange] || {};

                    return {
                        savedGridLayouts: {
                            ...state.savedGridLayouts,
                            [chartId]: {
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
            setActiveGroup: (groupId: string) => {
                set({ activeGroupId: groupId });
            },
            createGroup: (name: string) => {
                const newGroupId = crypto.randomUUID();
                set((state) => ({
                    groups: [...state.groups, { id: newGroupId, name, chartIds: [] }],
                    activeGroupId: newGroupId,
                }));
                return newGroupId;
            },
            renameGroup: (groupId: string, name: string) => {
                set((state) => ({
                    groups: state.groups.map((group) => (group.id === groupId ? { ...group, name } : group)),
                }));
            },
            deleteGroup: (groupId: string) => {
                if (groupId === DEFAULT_GROUP_ID) return;

                set((state) => {
                    const groupToDelete = state.groups.find((g) => g.id === groupId);
                    if (!groupToDelete) return state;

                    // Remove charts that belong to this group
                    const chartIdsToRemove = new Set(groupToDelete.chartIds);
                    const newChartIds = state.chartIds.filter((chart) => !chartIdsToRemove.has(chart.id));

                    // Remove layouts for deleted charts
                    const newLayouts = { ...state.savedGridLayouts };
                    groupToDelete.chartIds.forEach((chartId) => {
                        delete newLayouts[chartId];
                    });

                    // Remove the group
                    const newGroups = state.groups.filter((g) => g.id !== groupId);

                    // Switch to default group if active group is being deleted
                    const newActiveGroupId = state.activeGroupId === groupId ? DEFAULT_GROUP_ID : state.activeGroupId;

                    return {
                        chartIds: newChartIds,
                        groups: newGroups,
                        savedGridLayouts: newLayouts,
                        activeGroupId: newActiveGroupId,
                    };
                });
            },
            addChartToGroup: (type: ChartType, groupId?: string) => {
                const state = get();
                const targetGroupId = groupId || state.activeGroupId;
                const newChartId = crypto.randomUUID();

                set((state) => {
                    const updatedGroups = state.groups.map((group) =>
                        group.id === targetGroupId ? { ...group, chartIds: [newChartId, ...group.chartIds] } : group,
                    );

                    return {
                        chartIds: [{ type, id: newChartId }, ...state.chartIds],
                        groups: updatedGroups,
                    };
                });
            },
        }),
        {
            name: 'chart-layout',
            version: 4,
        },
    ),
);

export default useChartStore;
