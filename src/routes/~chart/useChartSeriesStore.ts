import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { safeJSONStorage } from '@/lib/safeStorage';

import type { SeriesVisibility } from './types';

// All sub-series visible by default; a panel with no stored entry reads this.
export const defaultSeriesVisibility: SeriesVisibility = { book: true, spread: true, volume: true };

export interface ChartSeriesStore {
    visibility: Record<string, SeriesVisibility>;
    toggleSeries: (panelId: string, key: keyof SeriesVisibility) => void;
    removeSeries: (panelId: string) => void;
}

const useChartSeriesStore = create<ChartSeriesStore>()(
    persist(
        (set) => ({
            visibility: {},
            toggleSeries: (panelId, key) =>
                set((state) => {
                    const current = state.visibility[panelId] ?? defaultSeriesVisibility;
                    return {
                        visibility: { ...state.visibility, [panelId]: { ...current, [key]: !current[key] } },
                    };
                }),
            removeSeries: (panelId) =>
                set((state) => {
                    const { [panelId]: _removed, ...rest } = state.visibility;
                    return { visibility: rest };
                }),
        }),
        {
            name: 'chart-series',
            version: 1,
            storage: safeJSONStorage(),
        },
    ),
);

export default useChartSeriesStore;
