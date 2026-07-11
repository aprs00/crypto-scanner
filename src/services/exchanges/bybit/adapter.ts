import type { ExchangeAdapter } from '../types';

import { subscribeBbo, subscribeDepth, subscribeTrades } from './streams';
import { fetchBybitSymbols } from './symbols';

const bybit: ExchangeAdapter = {
    id: 'bybit',
    label: 'BYBIT',

    fetchSymbols: fetchBybitSymbols,

    subscribeBbo,

    subscribeDepth,

    subscribeTrades,

    // Bybit linear perpetuals on TradingView use the `.P` suffix.
    toTradingViewSymbol: (symbol: string): string => `BYBIT:${symbol}.P`,
};

export default bybit;
