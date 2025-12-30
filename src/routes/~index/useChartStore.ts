import { type Layout } from 'react-grid-layout';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
    ChartType,
    Exchange,
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
};

export interface ChartStore {
    chartIds: ChartItem[];
    savedGridLayouts: Record<string, GridLayout>;
    addChart: (type: ChartType) => void;
    removeChart: (id: string, type: ChartType) => void;
    saveGridLayout: (key: string, layout: Layout) => void;
    handleLayoutChange: (layouts: Layout[]) => void;
    setChartExchange: (chartId: string, exchange: Exchange) => void;
    updateExchangeConfig: (chartId: string, exchange: Exchange, config: ExchangeChartConfig) => void;
}

const getDefaultChartIds = () => [
    { type: ChartType.BetaHeatmap, id: crypto.randomUUID() },
    { type: ChartType.Scatter, id: crypto.randomUUID() },
    { type: ChartType.ZScoreHeatmap, id: crypto.randomUUID() },
    { type: ChartType.PriceChangePercentageDay, id: crypto.randomUUID() },
    { type: ChartType.PriceChangePercentageHour, id: crypto.randomUUID() },
    { type: ChartType.CorrelationPairHistory, id: crypto.randomUUID() },
];

const useChartStore = create<ChartStore>()(
    persist(
        (set, get) => ({
            chartIds: getDefaultChartIds(),
            savedGridLayouts: {},
            addChart: (type) => {
                const state = get();
                const clickedChartIndex = state.chartIds.findIndex((chart) => chart.type === type);

                set((state) => ({
                    chartIds: [
                        ...state.chartIds.slice(0, clickedChartIndex),
                        { type, id: crypto.randomUUID() },
                        ...state.chartIds.slice(clickedChartIndex),
                    ],
                }));
            },
            removeChart: (id) => {
                set((state) => ({
                    chartIds: state.chartIds.filter((chart) => chart.id !== id),
                }));
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
            setChartExchange: (chartId: string, exchange: Exchange) => {
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
            updateExchangeConfig: (chartId: string, exchange: Exchange, config: ExchangeChartConfig) => {
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
        }),
        {
            name: 'chart-layout',
            version: 3,
            migrate: (persistedState, version) =>
                version < 3 ? { chartIds: getDefaultChartIds(), savedGridLayouts: {} } : (persistedState as ChartStore),
            onRehydrateStorage: () => (state) => {
                if (!state) return;

                const allChartTypes = Object.values(ChartType);
                const existingChartTypes = new Set(state.chartIds.map((chart) => chart.type));
                const missingChartTypes = allChartTypes.filter((type) => !existingChartTypes.has(type));

                if (missingChartTypes.length === 0) return;

                const newCharts = missingChartTypes.map((type) => ({
                    type,
                    id: crypto.randomUUID(),
                }));

                state.chartIds = [...state.chartIds, ...newCharts];
            },
        },
    ),
);

export default useChartStore;
