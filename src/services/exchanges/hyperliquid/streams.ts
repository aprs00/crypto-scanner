import type { LocalOrderBook, OrderBookLevel } from '@/routes/~chart/types';

import type { NormalizedTrade, OrderBookSubscriber, TradeSubscriber } from '../types';

import MultiplexedSocket from '../_shared/multiplexed-socket';

const WS_URL = 'wss://api.hyperliquid.xyz/ws';
const PING_INTERVAL_MS = 30_000; // server drops idle sockets ~60s

type HlSub = { type: 'l2Book' | 'trades'; coin: string; fast?: boolean };
type HlLevel = { px: string; sz: string; n: number };
type HlBook = { coin: string; time: number; levels: [HlLevel[], HlLevel[]] };
type HlTrade = { coin: string; side: string; px: string; sz: string; time: number; tid: number };

const toLevels = (levels: HlLevel[]): OrderBookLevel[] => levels.map((level) => [+level.px, +level.sz]);

// fast & slow l2Book share channel + coin; only `fast` tells them apart, so it has
// to be part of the routing key.
const bookKey = (coin: string, fast: boolean | undefined) => `l2Book${fast ? '-fast' : ''}:${coin}`;

const socket = new MultiplexedSocket<HlSub>({
    keyOf: (sub) => (sub.type === 'l2Book' ? bookKey(sub.coin, sub.fast) : `${sub.type}:${sub.coin}`),
    pingFrame: { method: 'ping' },
    pingIntervalMs: PING_INTERVAL_MS,
    route: (msg: any) => {
        if (msg?.channel === 'l2Book' && msg.data?.coin) {
            return [{ data: msg.data, key: bookKey(msg.data.coin, msg.data.fast) }];
        }
        if (msg?.channel === 'trades') {
            // trades payload is an array; route by the coin of the first trade.
            const coin = msg.data?.[0]?.coin;
            if (coin) return [{ data: msg.data, key: `trades:${coin}` }];
        }
        return [];
    },
    subscribeFrame: (sub) => ({ method: 'subscribe', subscription: sub }),
    unsubscribeFrame: (sub) => ({ method: 'unsubscribe', subscription: sub }),
    url: WS_URL,
});

const toLocal = (book: HlBook): LocalOrderBook => ({
    asks: toLevels(book.levels[1]),
    bids: toLevels(book.levels[0]),
    lastUpdateId: book.time,
});

// Merge HL's two l2Book feeds: fast (~5 levels, ~2/s) stays authoritative near the
// spread; slow (~20 levels, ~0.2/s) only adds levels beyond the fast band. Keeps the
// top fresh, fills depth, and drops stale overlap so the book can't cross.
const mergeBooks = (fast: HlBook | null, slow: HlBook | null): LocalOrderBook | null => {
    if (!fast || !slow) return fast ? toLocal(fast) : slow ? toLocal(slow) : null;

    const fastBids = toLevels(fast.levels[0]);
    const fastAsks = toLevels(fast.levels[1]);
    // far edge of the fast band (levels are best-first); slow only adds past these
    const bidFloor = fastBids.length ? fastBids[fastBids.length - 1][0] : Infinity;
    const askCeil = fastAsks.length ? fastAsks[fastAsks.length - 1][0] : -Infinity;

    return {
        asks: [...fastAsks, ...toLevels(slow.levels[1]).filter(([px]) => px > askCeil)],
        bids: [...fastBids, ...toLevels(slow.levels[0]).filter(([px]) => px < bidFloor)],
        lastUpdateId: Math.max(fast.time, slow.time),
    };
};

export const subscribeOrderBook = (symbol: string, cb: OrderBookSubscriber): (() => void) => {
    let fast: HlBook | null = null;
    let slow: HlBook | null = null;
    const emit = () => {
        const merged = mergeBooks(fast, slow);
        if (merged) cb(merged);
    };

    const offFast = socket.subscribe<HlBook>({ coin: symbol, fast: true, type: 'l2Book' }, (book) => {
        fast = book;
        emit();
    });
    const offSlow = socket.subscribe<HlBook>({ coin: symbol, type: 'l2Book' }, (book) => {
        slow = book;
        emit();
    });

    return () => {
        offFast();
        offSlow();
    };
};

export const subscribeTrades = (symbol: string, cb: TradeSubscriber): (() => void) =>
    socket.subscribe<HlTrade[]>({ coin: symbol, type: 'trades' }, (trades) => {
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
    });
