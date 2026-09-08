import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { safeJSONStorage } from '@/lib/safeStorage';
import { ExchangeId, type ExchangeId as ExchangeIdValue } from '@/services/exchanges/types';

import { DASHBOARD_PERSISTENCE_VERSION, isRecord } from '../../../model/persistence';

// `base` is the coin (e.g. "BTC"); it carries the selection across an exchange
// switch even though the native `symbol` differs ("BTCUSDT" vs "BTC").
export type PanelSource = { exchange: ExchangeIdValue; symbol: string; base: string };

export const defaultPanelSource: PanelSource = {
    base: 'BTC',
    exchange: ExchangeId.Binance,
    symbol: 'BTCUSDT',
};

interface ChartSourceStore {
    sources: Record<string, PanelSource>;
    setExchange: (panelId: string, exchange: ExchangeIdValue) => void;
    setSymbol: (panelId: string, symbol: string, base: string) => void;
    removeSource: (panelId: string) => void;
}

type ChartSourcePersistence = Pick<ChartSourceStore, 'sources'>;

const exchangeIds = new Set<string>(Object.values(ExchangeId));

export const normalizeChartSourcePersistence = (value: unknown): ChartSourcePersistence => {
    if (!isRecord(value) || !isRecord(value.sources)) return { sources: {} };

    const sources: Record<string, PanelSource> = {};
    for (const [panelId, candidate] of Object.entries(value.sources)) {
        if (!panelId.trim() || !isRecord(candidate)) continue;

        const exchange =
            typeof candidate.exchange === 'string' && exchangeIds.has(candidate.exchange)
                ? (candidate.exchange as ExchangeIdValue)
                : defaultPanelSource.exchange;
        sources[panelId] = {
            base: typeof candidate.base === 'string' ? candidate.base : defaultPanelSource.base,
            exchange,
            symbol: typeof candidate.symbol === 'string' ? candidate.symbol : defaultPanelSource.symbol,
        };
    }

    return { sources };
};

const useChartSourceStore = create<ChartSourceStore>()(
    persist(
        (set) => ({
            sources: {},
            // Keep `base`, clear `symbol`; useResolvedSource re-picks the matching
            // symbol on the new exchange once its symbol list loads.
            setExchange: (panelId, exchange) =>
                set((state) => {
                    const current = state.sources[panelId] ?? defaultPanelSource;
                    return { sources: { ...state.sources, [panelId]: { ...current, exchange, symbol: '' } } };
                }),
            setSymbol: (panelId, symbol, base) =>
                set((state) => {
                    const current = state.sources[panelId] ?? defaultPanelSource;
                    return { sources: { ...state.sources, [panelId]: { ...current, symbol, base } } };
                }),
            removeSource: (panelId) =>
                set((state) => {
                    const { [panelId]: _removed, ...rest } = state.sources;
                    return { sources: rest };
                }),
        }),
        {
            name: 'dashboard-chart-sources',
            storage: safeJSONStorage(),
            version: DASHBOARD_PERSISTENCE_VERSION,
            migrate: normalizeChartSourcePersistence,
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...normalizeChartSourcePersistence(persistedState),
            }),
        },
    ),
);

export default useChartSourceStore;
