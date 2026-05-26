import type { BootstrapResponse } from '@/routes/~index/types';

import api from '@/lib/api';

import type { ExchangeAdapter, ExchangeSymbol } from '../types';

const STREAMING_NOT_SUPPORTED = 'Bybit streaming is not implemented; this adapter only powers the TradingView panel.';

const baseFromSymbol = (s: string): string => (s.endsWith('USDT') ? s.slice(0, -4) : s);

const bybit: ExchangeAdapter = {
    id: 'bybit',
    label: 'BYBIT',

    fetchSymbols: async (): Promise<ExchangeSymbol[]> => {
        const { data } = await api.get<BootstrapResponse>('bootstrap');
        const symbols = data.exchange_data?.bybit?.symbols ?? [];
        return symbols.map((symbol) => ({
            base: baseFromSymbol(symbol),
            label: symbol,
            symbol,
            tickSize: 0,
        }));
    },

    subscribeOrderBook: () => {
        throw new Error(STREAMING_NOT_SUPPORTED);
    },

    subscribeTrades: () => {
        throw new Error(STREAMING_NOT_SUPPORTED);
    },

    // Bybit linear perpetuals on TradingView use the `.P` suffix.
    toTradingViewSymbol: (symbol: string): string => `BYBIT:${symbol}.P`,
};

export default bybit;
