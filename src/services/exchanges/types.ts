// Maintained local books use numeric [price, quantity] levels. Bids are sorted
// high-to-low and asks low-to-high before adapters publish them.
export type OrderBookLevel = [number, number];

export type LocalOrderBook = {
    asks: OrderBookLevel[];
    bids: OrderBookLevel[];
};

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
    tickSize: number; // current native price increment used for order-book grouping
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

// `farPrice` is the inclusive outer edge through which the adapter can vouch for
// the current side. When `truncated` is false, the source reported the complete
// side and prices beyond the last active level are known empty rather than
// unavailable.
export type DepthSideCoverage = Readonly<{
    farPrice: number | null;
    truncated: boolean;
}>;

export type DepthCoverage = Readonly<{
    asks: DepthSideCoverage;
    bids: DepthSideCoverage;
}>;

export const EMPTY_DEPTH_COVERAGE: DepthCoverage = {
    asks: { farPrice: null, truncated: true },
    bids: { farPrice: null, truncated: true },
};

// A depth state is only `healthy` after the exchange-specific synchronization
// contract has completed. `book` is retained across a disconnect for diagnostics,
// but consumers must use `status` before presenting it as current liquidity.
//
// `generation` identifies an acquisition baseline. It changes when continuity is
// lost or an authoritative replacement must not be compared with the prior book.
// Normal updates (including Hyperliquid's replacement-format messages) keep the
// same generation.
export type DepthState = Readonly<{
    book: LocalOrderBook;
    coverage: DepthCoverage;
    generation: number;
    status: DepthFeedStatus;
}>;

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
