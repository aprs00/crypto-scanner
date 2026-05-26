import type { LocalOrderBook, OrderBookLevel } from '@/routes/~chart/types';

import { hyperliquidInstance } from '@/lib/api';

import type { ExchangeAdapter, ExchangeSymbol, NormalizedTrade, OrderBookSubscriber, TradeSubscriber } from '../types';

import HyperliquidWsManager from './ws';

// Perps allow up to MAX_DECIMALS - szDecimals price decimals; we use that as the
// grouping tick. Spot would use 8 here.
const PERP_MAX_DECIMALS = 6;

type HlLevel = { px: string; sz: string; n: number };
type HlBook = { coin: string; time: number; levels: [HlLevel[], HlLevel[]] };
type HlTrade = { coin: string; side: string; px: string; sz: string; time: number; tid: number };
type HlMeta = { universe: { name: string; szDecimals: number; isDelisted?: boolean }[] };

const toLevels = (levels: HlLevel[]): OrderBookLevel[] => levels.map((level) => [+level.px, +level.sz]);

const hyperliquid: ExchangeAdapter = {
    id: 'hyperliquid',
    label: 'HYPERLIQUID',

    fetchSymbols: async (): Promise<ExchangeSymbol[]> => {
        const { data } = await hyperliquidInstance.post<HlMeta>('/info', { type: 'meta' });
        return data.universe
            .filter((asset) => !asset.isDelisted)
            .map((asset) => ({
                base: asset.name,
                label: `${asset.name}-PERP`,
                symbol: asset.name,
                tickSize: 10 ** -(PERP_MAX_DECIMALS - asset.szDecimals),
            }));
    },

    // l2Book pushes full snapshots (levels[0] = bids high→low, levels[1] = asks
    // low→high), so we just map each message — no diff/resync handshake needed.
    subscribeOrderBook: (symbol: string, cb: OrderBookSubscriber): (() => void) =>
        HyperliquidWsManager.get().subscribe('l2Book', symbol, (data) => {
            const book = data as HlBook;
            const localBook: LocalOrderBook = {
                asks: toLevels(book.levels[1]),
                bids: toLevels(book.levels[0]),
                lastUpdateId: book.time,
            };
            cb(localBook);
        }),

    subscribeTrades: (symbol: string, cb: TradeSubscriber): (() => void) =>
        HyperliquidWsManager.get().subscribe('trades', symbol, (data) => {
            const trades = data as HlTrade[];
            for (const t of trades) {
                const trade: NormalizedTrade = {
                    id: t.tid,
                    // HL `side` is the aggressor side; "A" (hit the ask) ≈ Binance buyer-is-maker.
                    isBuyerMaker: t.side === 'A',
                    price: +t.px,
                    size: +t.sz,
                    time: t.time,
                };
                cb(trade);
            }
        }),

    // TradingView's public widget has no Hyperliquid feed; HL is excluded from
    // the TradingView panel via TRADINGVIEW_EXCHANGES. This stays only to satisfy
    // the interface contract and is never called.
    toTradingViewSymbol: (symbol: string): string => `BINANCE:${symbol}USDT`,
};

export default hyperliquid;
