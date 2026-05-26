import type { LocalOrderBook } from '@/routes/~chart/types';

export type ExchangeId = 'binance' | 'hyperliquid' | 'bybit' | 'okx';

// One tradable market on an exchange, normalized so panels and selectors
// don't care which exchange it came from.
export type ExchangeSymbol = {
    symbol: string; // native subscription symbol: "BTCUSDT" (binance) | "BTC" (hyperliquid)
    label: string; // display label: "BTCUSDT" | "BTC-PERP"
    base: string; // base coin: "BTC" — used to carry the coin across an exchange switch
    tickSize: number; // price increment used for order-book grouping
};

// A single trade, normalized across exchanges. `isBuyerMaker` carries the same
// meaning as Binance's aggTrade `m` flag (true => the aggressor was a seller).
export type NormalizedTrade = {
    id: number | string;
    price: number;
    size: number;
    time: number;
    isBuyerMaker: boolean;
};

export type OrderBookSubscriber = (book: LocalOrderBook) => void;

export type TradeSubscriber = (trade: NormalizedTrade) => void;

// Everything a chart panel needs from an exchange. One implementation per
// exchange; adding a new exchange means writing one of these and registering it.
export interface ExchangeAdapter {
    id: ExchangeId;
    label: string; // uppercase for the segmented control, e.g. "BINANCE"
    subscribeOrderBook(symbol: string, cb: OrderBookSubscriber): () => void; // returns unsubscribe
    subscribeTrades(symbol: string, cb: TradeSubscriber): () => void; // returns unsubscribe
    fetchSymbols(): Promise<ExchangeSymbol[]>;
    toTradingViewSymbol(symbol: string): string; // "BINANCE:BTCUSDT" or a proxy
}
