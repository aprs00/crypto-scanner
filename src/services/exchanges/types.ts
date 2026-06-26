import type { LocalOrderBook } from '@/routes/~chart/types';

export type ExchangeId = 'binance' | 'hyperliquid' | 'bybit';

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

export type OrderBookSubscriber = (book: LocalOrderBook) => void;

export type TradeSubscriber = (trade: NormalizedTrade) => void;

export interface ExchangeAdapter {
    id: ExchangeId;
    label: string; // uppercase for the segmented control, e.g. "BINANCE"
    subscribeOrderBook(symbol: string, cb: OrderBookSubscriber): () => void; // returns unsubscribe
    subscribeTrades(symbol: string, cb: TradeSubscriber): () => void; // returns unsubscribe
    fetchSymbols(): Promise<ExchangeSymbol[]>;
    toTradingViewSymbol(symbol: string): string;
}
