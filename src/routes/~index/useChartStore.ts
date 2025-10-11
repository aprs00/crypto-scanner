import { type Layout } from 'react-grid-layout';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ChartType, type ChartConfig, type ChartItem, type ChartTemplate, type GridLayout } from './types';

export const CHART_HEIGHT = 25;

export const chartTemplates: Record<ChartType, ChartTemplate> = {
    [ChartType.BetaHeatmap]: {
        gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: 0, i: '1' },
        type: ChartType.BetaHeatmap,
    },
    [ChartType.CorrelationPairHistory]: {
        gridLayout: { h: 12, w: 12, x: 0, y: CHART_HEIGHT, i: '2' },
        type: ChartType.CorrelationPairHistory,
    },
    [ChartType.Scatter]: {
        gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 2, i: '3' },
        type: ChartType.Scatter,
    },
    [ChartType.ZScoreHeatmap]: {
        gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 4, i: '5' },
        type: ChartType.ZScoreHeatmap,
    },
    [ChartType.PriceChangePercentageDay]: {
        gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 5, i: '6' },
        type: ChartType.PriceChangePercentageDay,
    },
    [ChartType.PriceChangePercentageHour]: {
        gridLayout: { h: 20, w: 12, x: 0, y: CHART_HEIGHT * 6, i: '7' },
        type: ChartType.PriceChangePercentageHour,
    },
};

export interface ChartStore {
    chartIds: ChartItem[];
    savedGridLayouts: Record<string, GridLayout>;
    addChart: (type: ChartType) => void;
    removeChart: (id: string, type: ChartType) => void;
    saveGridLayout: (key: string, layout: Layout) => void;
    handleLayoutChange: (layouts: Layout[]) => void;
    updateChartConfig: (chartId: string, config: ChartConfig) => void;
}

const useChartStore = create<ChartStore>()(
    persist(
        (set, get) => ({
            chartIds: [
                { type: ChartType.BetaHeatmap, id: crypto.randomUUID() },
                { type: ChartType.Scatter, id: crypto.randomUUID() },
                { type: ChartType.ZScoreHeatmap, id: crypto.randomUUID() },
                { type: ChartType.PriceChangePercentageDay, id: crypto.randomUUID() },
                { type: ChartType.PriceChangePercentageHour, id: crypto.randomUUID() },
                { type: ChartType.CorrelationPairHistory, id: crypto.randomUUID() },
            ],
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
                        // [key]: layout,
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
            updateChartConfig: (chartId: string, config: ChartConfig) => {
                set((state) => {
                    return {
                        savedGridLayouts: {
                            ...state.savedGridLayouts,
                            [chartId]: {
                                ...(state.savedGridLayouts[chartId] || {}),
                                ...config,
                            },
                        },
                    };
                });
            },
        }),
        { name: 'chart-layout' },
    ),
);

export default useChartStore;
