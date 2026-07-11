import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { safeJSONStorage } from '@/lib/safeStorage';

import type { SeriesVisibility } from './types';

// All sub-series visible by default; a panel with no stored entry reads this.
export const defaultSeriesVisibility: SeriesVisibility = { book: true, liquidity: true, spread: true, volume: true };

export const LiquidityIntensity = {
    High: 'high',
    Low: 'low',
    Medium: 'medium',
} as const;
export type LiquidityIntensity = (typeof LiquidityIntensity)[keyof typeof LiquidityIntensity];

export const LiquidityContrast = {
    Normal: 'normal',
    Sharp: 'sharp',
    Soft: 'soft',
} as const;
export type LiquidityContrast = (typeof LiquidityContrast)[keyof typeof LiquidityContrast];

export type LiquidityPreferences = {
    contrast: LiquidityContrast;
    intensity: LiquidityIntensity;
    minNotional: number;
    thresholdMarket: string;
};

export const defaultLiquidityPreferences: LiquidityPreferences = {
    contrast: LiquidityContrast.Normal,
    intensity: LiquidityIntensity.Medium,
    minNotional: 0,
    thresholdMarket: '',
};

const MAX_THRESHOLD = 1_000_000_000_000;

const safeVisibility = (value: unknown): SeriesVisibility => {
    const candidate = value as Partial<SeriesVisibility> | null;
    return {
        book: typeof candidate?.book === 'boolean' ? candidate.book : true,
        liquidity: typeof candidate?.liquidity === 'boolean' ? candidate.liquidity : true,
        spread: typeof candidate?.spread === 'boolean' ? candidate.spread : true,
        volume: typeof candidate?.volume === 'boolean' ? candidate.volume : true,
    };
};

const safeLiquidityPreferences = (value: unknown): LiquidityPreferences => {
    const candidate = value as Partial<LiquidityPreferences> | null;
    const intensity = Object.values(LiquidityIntensity).includes(candidate?.intensity as LiquidityIntensity)
        ? (candidate?.intensity as LiquidityIntensity)
        : LiquidityIntensity.Medium;
    const contrast = Object.values(LiquidityContrast).includes(candidate?.contrast as LiquidityContrast)
        ? (candidate?.contrast as LiquidityContrast)
        : LiquidityContrast.Normal;
    const minNotional = Number.isFinite(candidate?.minNotional)
        ? Math.max(0, Math.min(MAX_THRESHOLD, Number(candidate?.minNotional)))
        : 0;
    return {
        contrast,
        intensity,
        minNotional,
        thresholdMarket: typeof candidate?.thresholdMarket === 'string' ? candidate.thresholdMarket : '',
    };
};

export interface ChartSeriesStore {
    liquidity: Record<string, LiquidityPreferences>;
    visibility: Record<string, SeriesVisibility>;
    setLiquidityContrast: (panelId: string, value: LiquidityContrast) => void;
    setLiquidityIntensity: (panelId: string, value: LiquidityIntensity) => void;
    setLiquidityMarket: (panelId: string, market: string) => void;
    setMinNotional: (panelId: string, value: number) => void;
    toggleSeries: (panelId: string, key: keyof SeriesVisibility) => void;
    removeSeries: (panelId: string) => void;
}

const useChartSeriesStore = create<ChartSeriesStore>()(
    persist(
        (set) => ({
            liquidity: {},
            visibility: {},
            setLiquidityContrast: (panelId, contrast) =>
                set((state) => {
                    const current = state.liquidity[panelId] ?? defaultLiquidityPreferences;
                    return { liquidity: { ...state.liquidity, [panelId]: { ...current, contrast } } };
                }),
            setLiquidityIntensity: (panelId, intensity) =>
                set((state) => {
                    const current = state.liquidity[panelId] ?? defaultLiquidityPreferences;
                    return { liquidity: { ...state.liquidity, [panelId]: { ...current, intensity } } };
                }),
            setLiquidityMarket: (panelId, market) =>
                set((state) => {
                    const current = state.liquidity[panelId] ?? defaultLiquidityPreferences;
                    if (current.thresholdMarket === market) return state;
                    return {
                        liquidity: {
                            ...state.liquidity,
                            [panelId]: { ...current, minNotional: 0, thresholdMarket: market },
                        },
                    };
                }),
            setMinNotional: (panelId, value) =>
                set((state) => {
                    const current = state.liquidity[panelId] ?? defaultLiquidityPreferences;
                    const minNotional = Number.isFinite(value) ? Math.max(0, Math.min(MAX_THRESHOLD, value)) : 0;
                    return { liquidity: { ...state.liquidity, [panelId]: { ...current, minNotional } } };
                }),
            toggleSeries: (panelId, key) =>
                set((state) => {
                    const current = state.visibility[panelId] ?? defaultSeriesVisibility;
                    return {
                        visibility: { ...state.visibility, [panelId]: { ...current, [key]: !current[key] } },
                    };
                }),
            removeSeries: (panelId) =>
                set((state) => {
                    const { [panelId]: _removedVisibility, ...visibility } = state.visibility;
                    const { [panelId]: _removedLiquidity, ...liquidity } = state.liquidity;
                    return { liquidity, visibility };
                }),
        }),
        {
            name: 'chart-series',
            version: 2,
            storage: safeJSONStorage(),
            migrate: (persisted) => persisted as ChartSeriesStore,
            merge: (persisted, current) => {
                const saved = persisted as Partial<ChartSeriesStore> | undefined;
                const visibility = Object.fromEntries(
                    Object.entries(saved?.visibility ?? {}).map(([panelId, value]) => [panelId, safeVisibility(value)]),
                );
                const liquidity = Object.fromEntries(
                    Object.entries(saved?.liquidity ?? {}).map(([panelId, value]) => [
                        panelId,
                        safeLiquidityPreferences(value),
                    ]),
                );
                return { ...current, liquidity, visibility };
            },
        },
    ),
);

export default useChartSeriesStore;
