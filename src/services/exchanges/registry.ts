import type { ExchangeAdapter, ExchangeId } from './types';

import binance from './binance/adapter';
import bybit from './bybit/adapter';
import hyperliquid from './hyperliquid/adapter';

export const exchanges: Record<ExchangeId, ExchangeAdapter> = {
    binance,
    bybit,
    hyperliquid,
};

export const getExchange = (id: ExchangeId): ExchangeAdapter => exchanges[id];

// WS streaming (order book + trades); used by OrderBook, Depth and Tape panels.
export const STREAMING_EXCHANGES: ExchangeId[] = ['binance', 'hyperliquid', 'bybit'];

// TradingView-renderable exchanges; Hyperliquid has no TV feed.
export const TRADINGVIEW_EXCHANGES: ExchangeId[] = ['binance', 'bybit'];
