import type { ExchangeAdapter } from '../types';

import { subscribeOrderBook, subscribeTrades } from './streams';
import { fetchHyperliquidSymbols } from './symbols';

const hyperliquid: ExchangeAdapter = {
    id: 'hyperliquid',
    label: 'HYPERLIQUID',

    fetchSymbols: fetchHyperliquidSymbols,

    subscribeOrderBook,

    subscribeTrades,

    // HL has no TradingView feed (excluded via TRADINGVIEW_EXCHANGES); never called.
    toTradingViewSymbol: (symbol: string): string => `BINANCE:${symbol}USDT`,
};

export default hyperliquid;
