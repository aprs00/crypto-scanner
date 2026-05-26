import type { BootstrapResponse } from '@/routes/~index/types';

import api from '@/lib/api';

import type { ExchangeAdapter, ExchangeSymbol } from '../types';

const STREAMING_NOT_SUPPORTED = 'OKX streaming is not implemented; this adapter only powers the TradingView panel.';

// OKX swap symbols look like "BTC-USDT-SWAP"; base is the first segment.
const baseFromSymbol = (s: string): string => s.split('-')[0] ?? s;

// TradingView OKX perp ticker for "BTC-USDT-SWAP" is "OKX:BTCUSDT.P".
const toTvSymbol = (s: string): string => `OKX:${s.replace('-USDT-SWAP', 'USDT.P').replace(/-/g, '')}`;

const okx: ExchangeAdapter = {
    id: 'okx',
    label: 'OKX',

    fetchSymbols: async (): Promise<ExchangeSymbol[]> => {
        const { data } = await api.get<BootstrapResponse>('bootstrap');
        const symbols = data.exchange_data?.okx?.symbols ?? [];
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

    toTradingViewSymbol: toTvSymbol,
};

export default okx;
