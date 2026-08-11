import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { safeJSONStorage } from '@/lib/safeStorage';

import { ChartType, type ChartType as ChartTypeValue } from './types';

export type FootprintSettings = {
    chartType: ChartTypeValue;
    continuationTicks: number;
    marketKey?: string;
    reversalTicks: number;
    ticksPerRow: number;
    tradesPerBar: number;
};

export const FOOTPRINT_SETTING_LIMITS = {
    ticksPerRow: { max: 1_000, min: 1 },
    tradesPerBar: { max: 4_000, min: 1 },
    trevTicks: { max: 4_000, min: 1 },
} as const;

export const defaultFootprintSettings: FootprintSettings = {
    chartType: ChartType.Tick,
    continuationTicks: 20,
    reversalTicks: 30,
    ticksPerRow: 5,
    tradesPerBar: 500,
};

const clampInteger = (value: unknown, fallback: number, min: number, max: number): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, Math.round(value)));
};

const normalizeSettings = (value: FootprintSettings): FootprintSettings => ({
    chartType: value.chartType === ChartType.Trev ? ChartType.Trev : ChartType.Tick,
    continuationTicks: clampInteger(
        value.continuationTicks,
        defaultFootprintSettings.continuationTicks,
        FOOTPRINT_SETTING_LIMITS.trevTicks.min,
        FOOTPRINT_SETTING_LIMITS.trevTicks.max,
    ),
    marketKey: typeof value.marketKey === 'string' ? value.marketKey : undefined,
    reversalTicks: clampInteger(
        value.reversalTicks,
        defaultFootprintSettings.reversalTicks,
        FOOTPRINT_SETTING_LIMITS.trevTicks.min,
        FOOTPRINT_SETTING_LIMITS.trevTicks.max,
    ),
    ticksPerRow: clampInteger(
        value.ticksPerRow,
        defaultFootprintSettings.ticksPerRow,
        FOOTPRINT_SETTING_LIMITS.ticksPerRow.min,
        FOOTPRINT_SETTING_LIMITS.ticksPerRow.max,
    ),
    tradesPerBar: clampInteger(
        value.tradesPerBar,
        defaultFootprintSettings.tradesPerBar,
        FOOTPRINT_SETTING_LIMITS.tradesPerBar.min,
        FOOTPRINT_SETTING_LIMITS.tradesPerBar.max,
    ),
});

type FootprintSettingsStore = {
    settings: Record<string, FootprintSettings>;
    removeSettings: (panelId: string) => void;
    setMarketKey: (panelId: string, marketKey: string) => void;
    setSettings: (panelId: string, settings: FootprintSettings) => void;
};

const settingsFor = (settings: Record<string, FootprintSettings>, panelId: string): FootprintSettings =>
    settings[panelId] ?? defaultFootprintSettings;

const useFootprintSettingsStore = create<FootprintSettingsStore>()(
    persist(
        (set) => ({
            removeSettings: (panelId) =>
                set((state) => {
                    const { [panelId]: _removed, ...settings } = state.settings;
                    return { settings };
                }),
            setMarketKey: (panelId, marketKey) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        [panelId]: { ...settingsFor(state.settings, panelId), marketKey },
                    },
                })),
            setSettings: (panelId, settings) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        [panelId]: normalizeSettings(settings),
                    },
                })),
            settings: {},
        }),
        {
            name: 'footprint-settings',
            storage: safeJSONStorage(),
        },
    ),
);

export default useFootprintSettingsStore;
