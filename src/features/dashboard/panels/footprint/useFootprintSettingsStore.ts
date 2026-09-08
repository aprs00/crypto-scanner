import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { safeJSONStorage } from '@/lib/safeStorage';

import { DASHBOARD_PERSISTENCE_VERSION, isRecord } from '../../model/persistence';
import { ChartType, type ChartType as ChartTypeValue } from './types';

export type FootprintSettings = {
    chartType: ChartTypeValue;
    continuationTicks: number;
    lookbackDays: number;
    marketKey?: string;
    reversalTicks: number;
    ticksPerRow: number;
    tradesPerBar: number;
};

export const FOOTPRINT_SETTING_LIMITS = {
    lookbackDays: { max: 30, min: 1 },
    ticksPerRow: { max: 1_000, min: 1 },
    tradesPerBar: { max: 4_000, min: 1 },
    trevTicks: { max: 4_000, min: 1 },
} as const;

export const defaultFootprintSettings: FootprintSettings = {
    chartType: ChartType.Trev,
    continuationTicks: 314,
    lookbackDays: 5,
    reversalTicks: 471,
    ticksPerRow: 50,
    tradesPerBar: 500,
};

const clampInteger = (value: unknown, fallback: number, min: number, max: number): number => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, Math.round(value)));
};

const normalizeSettings = (value: unknown): FootprintSettings => {
    const candidate = isRecord(value) ? value : {};

    return {
        chartType: candidate.chartType === ChartType.Trev ? ChartType.Trev : ChartType.Tick,
        continuationTicks: clampInteger(
            candidate.continuationTicks,
            defaultFootprintSettings.continuationTicks,
            FOOTPRINT_SETTING_LIMITS.trevTicks.min,
            FOOTPRINT_SETTING_LIMITS.trevTicks.max,
        ),
        lookbackDays: clampInteger(
            candidate.lookbackDays,
            defaultFootprintSettings.lookbackDays,
            FOOTPRINT_SETTING_LIMITS.lookbackDays.min,
            FOOTPRINT_SETTING_LIMITS.lookbackDays.max,
        ),
        marketKey: typeof candidate.marketKey === 'string' ? candidate.marketKey : undefined,
        reversalTicks: clampInteger(
            candidate.reversalTicks,
            defaultFootprintSettings.reversalTicks,
            FOOTPRINT_SETTING_LIMITS.trevTicks.min,
            FOOTPRINT_SETTING_LIMITS.trevTicks.max,
        ),
        ticksPerRow: clampInteger(
            candidate.ticksPerRow,
            defaultFootprintSettings.ticksPerRow,
            FOOTPRINT_SETTING_LIMITS.ticksPerRow.min,
            FOOTPRINT_SETTING_LIMITS.ticksPerRow.max,
        ),
        tradesPerBar: clampInteger(
            candidate.tradesPerBar,
            defaultFootprintSettings.tradesPerBar,
            FOOTPRINT_SETTING_LIMITS.tradesPerBar.min,
            FOOTPRINT_SETTING_LIMITS.tradesPerBar.max,
        ),
    };
};

type FootprintSettingsStore = {
    settings: Record<string, FootprintSettings>;
    removeSettings: (panelId: string) => void;
    setMarketKey: (panelId: string, marketKey: string) => void;
    setSettings: (panelId: string, settings: FootprintSettings) => void;
};

type FootprintSettingsPersistence = Pick<FootprintSettingsStore, 'settings'>;

export const normalizeFootprintSettingsPersistence = (value: unknown): FootprintSettingsPersistence => {
    if (!isRecord(value) || !isRecord(value.settings)) return { settings: {} };

    return {
        settings: Object.fromEntries(
            Object.entries(value.settings)
                .filter(([panelId]) => panelId.trim().length > 0)
                .map(([panelId, settings]) => [panelId, normalizeSettings(settings)]),
        ),
    };
};

const settingsFor = (settings: Record<string, FootprintSettings>, panelId: string): FootprintSettings => ({
    ...defaultFootprintSettings,
    ...settings[panelId],
});

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
            name: 'dashboard-footprint-settings',
            storage: safeJSONStorage(),
            version: DASHBOARD_PERSISTENCE_VERSION,
            migrate: normalizeFootprintSettingsPersistence,
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...normalizeFootprintSettingsPersistence(persistedState),
            }),
        },
    ),
);

export default useFootprintSettingsStore;
