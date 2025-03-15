import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ChartConfig, ChartItem, ChartType, Layout, LayoutItem } from './types';

interface ChartStore {
    chartIds: ChartItem[];
    savedGridLayouts: Record<
        string,
        {
            layout: Layout;
        } & ChartConfig
    >;
    addChart: (type: ChartType) => void;
    removeChart: (id: string, type: ChartType) => void;
    saveGridLayout: (key: string, layout: Layout) => void;
    handleLayoutChange: (layouts: LayoutItem[]) => void;
    updateChartConfig: (chartId: string, config: ChartConfig) => void;
}

const useChartStore = create<ChartStore>()(
    persist(
        (set, get) => ({
            chartIds: [
                { type: 'betaHeatmap', id: crypto.randomUUID() },
                { type: 'scatter', id: crypto.randomUUID() },
                { type: 'zScoreHistory', id: crypto.randomUUID() },
                { type: 'priceChangePercentageDay', id: crypto.randomUUID() },
                { type: 'priceChangePercentageHour', id: crypto.randomUUID() },
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
            removeChart: (id, type) => {
                const state = get();
                if (state.chartIds.filter((chart) => chart.type === type).length === 1) return;

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
            handleLayoutChange: (layouts: LayoutItem[]) => {
                const state = get();

                layouts.forEach((item) => {
                    const { i, x, y, w, h } = item;
                    state.saveGridLayout(i, { x, y, w, h });
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
