import type { ExchangeAdapter } from '../types';

import { subscribeOrderBook, subscribeTrades } from './streams';
import { fetchBinanceSymbols } from './symbols';

const binance: ExchangeAdapter = {
    id: 'binance',
    label: 'BINANCE',

    fetchSymbols: fetchBinanceSymbols,

    subscribeOrderBook,

    subscribeTrades,

    toTradingViewSymbol: (symbol: string): string => `BINANCE:${symbol}`,
};

export default binance;
