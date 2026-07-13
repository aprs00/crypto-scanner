import type { ExchangeAdapter } from '../types';

import { subscribeBbo, subscribeDepth, subscribeTrades } from './streams';
import { fetchBinanceSymbols } from './symbols';

const binance: ExchangeAdapter = {
    id: 'binance',
    label: 'BINANCE',

    fetchSymbols: fetchBinanceSymbols,

    subscribeBbo,

    subscribeDepth,

    subscribeTrades,

    toTradingViewSymbol: (symbol: string): string => `BINANCE:${symbol}.P`,
};

export default binance;
