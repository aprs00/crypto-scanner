import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { safeJSONStorage } from '@/lib/safeStorage';

import type { DomPreferences } from './domPreferences';
import type { SeriesVisibility } from './types';

import { DASHBOARD_PERSISTENCE_VERSION } from '../../../model/persistence';
import { defaultDomPreferences, sanitizeDomPreferences } from './domPreferences';

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

const safeBoolean = (value: unknown): boolean => value === true;

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

const safeEntries = (value: unknown): [string, unknown][] =>
    value !== null && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value) : [];

const safeRecord = <T>(value: unknown, sanitize: (item: unknown) => T): Record<string, T> =>
    Object.fromEntries(safeEntries(value).map(([panelId, item]) => [panelId, sanitize(item)]));

interface ChartSeriesStore {
    dom: Record<string, DomPreferences>;
    liquidity: Record<string, LiquidityPreferences>;
    orderBookNotional: Record<string, boolean>;
    visibility: Record<string, SeriesVisibility>;
    setDomPreferences: (panelId: string, patch: Partial<DomPreferences>) => void;
    setLiquidityContrast: (panelId: string, value: LiquidityContrast) => void;
    setLiquidityIntensity: (panelId: string, value: LiquidityIntensity) => void;
    setLiquidityMarket: (panelId: string, market: string) => void;
    setMinNotional: (panelId: string, value: number) => void;
    setOrderBookNotional: (panelId: string, value: boolean) => void;
    toggleSeries: (panelId: string, key: keyof SeriesVisibility) => void;
    removeSeries: (panelId: string) => void;
}

type ChartSeriesPersistence = Pick<ChartSeriesStore, 'dom' | 'liquidity' | 'orderBookNotional' | 'visibility'>;

const normalizeChartSeriesPersistence = (persisted: unknown): ChartSeriesPersistence => {
    const saved = persisted as Partial<ChartSeriesPersistence> | undefined;
    return {
        dom: safeRecord(saved?.dom, sanitizeDomPreferences),
        liquidity: safeRecord(saved?.liquidity, safeLiquidityPreferences),
        orderBookNotional: safeRecord(saved?.orderBookNotional, safeBoolean),
        visibility: safeRecord(saved?.visibility, safeVisibility),
    };
};

const useChartSeriesStore = create<ChartSeriesStore>()(
    persist(
        (set) => ({
            dom: {},
            liquidity: {},
            orderBookNotional: {},
            visibility: {},
            setDomPreferences: (panelId, patch) =>
                set((state) => {
                    const current = state.dom[panelId] ?? defaultDomPreferences;
                    const preferences = sanitizeDomPreferences({ ...current, ...patch });
                    return { dom: { ...state.dom, [panelId]: preferences } };
                }),
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
            setOrderBookNotional: (panelId, value) =>
                set((state) => ({
                    orderBookNotional: { ...state.orderBookNotional, [panelId]: value },
                })),
            toggleSeries: (panelId, key) =>
                set((state) => {
                    const current = state.visibility[panelId] ?? defaultSeriesVisibility;
                    return {
                        visibility: { ...state.visibility, [panelId]: { ...current, [key]: !current[key] } },
                    };
                }),
            removeSeries: (panelId) =>
                set((state) => {
                    const { [panelId]: _removedDom, ...dom } = state.dom;
                    const { [panelId]: _removedVisibility, ...visibility } = state.visibility;
                    const { [panelId]: _removedLiquidity, ...liquidity } = state.liquidity;
                    const { [panelId]: _removedOrderBookNotional, ...orderBookNotional } = state.orderBookNotional;
                    return { dom, liquidity, orderBookNotional, visibility };
                }),
        }),
        {
            name: 'dashboard-chart-series',
            storage: safeJSONStorage(),
            version: DASHBOARD_PERSISTENCE_VERSION,
            migrate: normalizeChartSeriesPersistence,
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...normalizeChartSeriesPersistence(persistedState),
            }),
        },
    ),
);

export default useChartSeriesStore;
