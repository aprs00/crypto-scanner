import type { LocalOrderBook } from '@/routes/~chart/types';

export const ExchangeId = {
    Binance: 'binance',
    Hyperliquid: 'hyperliquid',
    Bybit: 'bybit',
} as const;
export type ExchangeId = (typeof ExchangeId)[keyof typeof ExchangeId];

export type ExchangeSymbol = {
    symbol: string; // native subscription symbol: "BTCUSDT" (binance) | "BTC" (hyperliquid)
    label: string;
    base: string; // base coin, carried across an exchange switch
    tickSize: number; // price increment used for order-book grouping
};

// `isBuyerMaker` matches Binance's aggTrade `m` flag: true => the aggressor was
// a seller. Every adapter normalizes its taker side to this.
export type NormalizedTrade = {
    id: number | string;
    price: number;
    size: number;
    time: number;
    isBuyerMaker: boolean;
};

export const DepthFeedStatus = {
    Healthy: 'healthy',
    Stale: 'stale',
    Syncing: 'syncing',
} as const;
export type DepthFeedStatus = (typeof DepthFeedStatus)[keyof typeof DepthFeedStatus];

// A depth state is only `healthy` after the exchange-specific synchronization
// contract has completed. `book` is retained across a disconnect for diagnostics,
// but consumers must use `status` before presenting it as current liquidity.
export type DepthState = {
    book: LocalOrderBook;
    status: DepthFeedStatus;
};

export type DepthSubscriber = (state: DepthState) => void;

export type TradeSubscriber = (trade: NormalizedTrade) => void;

// Best bid/offer — real-time top-of-book from each exchange's bookTicker-style
// feed. Lighter than the full book and updated on every change; used by the tick
// chart so its bid/ask line tracks trades.
export type Bbo = { bid: number; ask: number; time: number };

export type BboSubscriber = (bbo: Bbo) => void;

export interface ExchangeAdapter {
    id: ExchangeId;
    label: string; // uppercase for the segmented control, e.g. "BINANCE"
    subscribeDepth(symbol: string, cb: DepthSubscriber): () => void;
    subscribeBbo(symbol: string, cb: BboSubscriber): () => void; // returns unsubscribe
    subscribeTrades(symbol: string, cb: TradeSubscriber): () => void; // returns unsubscribe
    fetchSymbols(): Promise<ExchangeSymbol[]>;
    toTradingViewSymbol(symbol: string): string;
}
