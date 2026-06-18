import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ExchangeId } from '@/services/exchanges/types';

import { safeJSONStorage } from '@/lib/safeStorage';

// `base` is the coin (e.g. "BTC"); it carries the selection across an exchange
// switch even though the native `symbol` differs ("BTCUSDT" vs "BTC").
export type PanelSource = { exchange: ExchangeId; symbol: string; base: string };

export const defaultPanelSource: PanelSource = { base: 'BTC', exchange: 'binance', symbol: 'BTCUSDT' };

export interface ChartSourceStore {
    sources: Record<string, PanelSource>;
    setExchange: (panelId: string, exchange: ExchangeId) => void;
    setSymbol: (panelId: string, symbol: string, base: string) => void;
    removeSource: (panelId: string) => void;
}

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
            name: 'chart-sources',
            version: 2,
            storage: safeJSONStorage(),
        },
    ),
);

export default useChartSourceStore;
