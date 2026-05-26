import type { ExchangeAdapter, ExchangeId } from './types';

import binance from './binance/adapter';
import bybit from './bybit/adapter';
import hyperliquid from './hyperliquid/adapter';
import okx from './okx/adapter';

export const exchanges: Record<ExchangeId, ExchangeAdapter> = {
    binance,
    bybit,
    hyperliquid,
    okx,
};

export const getExchange = (id: ExchangeId): ExchangeAdapter => exchanges[id];

// Exchanges that have full WS streaming (order book + trades). Used by OrderBook,
// Depth and Tape panels.
export const STREAMING_EXCHANGES: ExchangeId[] = ['binance', 'hyperliquid'];

// Exchanges TradingView's public widget can render. Hyperliquid has no TV feed.
export const TRADINGVIEW_EXCHANGES: ExchangeId[] = ['binance', 'bybit', 'okx'];
