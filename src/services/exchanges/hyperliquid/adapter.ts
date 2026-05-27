import type { ExchangeAdapter } from '../types';

import { subscribeOrderBook, subscribeTrades } from './streams';
import { fetchHyperliquidSymbols } from './symbols';

const hyperliquid: ExchangeAdapter = {
    id: 'hyperliquid',
    label: 'HYPERLIQUID',

    fetchSymbols: fetchHyperliquidSymbols,

    subscribeOrderBook,

    subscribeTrades,

    // TradingView's public widget has no Hyperliquid feed; HL is excluded from
    // the TradingView panel via TRADINGVIEW_EXCHANGES. This stays only to satisfy
    // the interface contract and is never called.
    toTradingViewSymbol: (symbol: string): string => `BINANCE:${symbol}USDT`,
};

export default hyperliquid;
