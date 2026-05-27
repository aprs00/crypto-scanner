import type { LocalOrderBook, OrderBookLevel } from '@/routes/~chart/types';

import type { NormalizedTrade, OrderBookSubscriber, TradeSubscriber } from '../types';

import MultiplexedSocket from '../_shared/multiplexed-socket';

const WS_URL = 'wss://api.hyperliquid.xyz/ws';
const PING_INTERVAL_MS = 30_000; // server drops idle sockets ~60s

type HlSub = { type: 'l2Book' | 'trades'; coin: string };
type HlLevel = { px: string; sz: string; n: number };
type HlBook = { coin: string; time: number; levels: [HlLevel[], HlLevel[]] };
type HlTrade = { coin: string; side: string; px: string; sz: string; time: number; tid: number };

const toLevels = (levels: HlLevel[]): OrderBookLevel[] => levels.map((level) => [+level.px, +level.sz]);

const socket = new MultiplexedSocket<HlSub>({
    keyOf: (sub) => `${sub.type}:${sub.coin}`,
    pingFrame: { method: 'ping' },
    pingIntervalMs: PING_INTERVAL_MS,
    route: (msg: any) => {
        if (msg?.channel === 'l2Book' && msg.data?.coin) {
            return [{ data: msg.data, key: `l2Book:${msg.data.coin}` }];
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

// l2Book pushes full snapshots (levels[0] = bids high→low, levels[1] = asks
// low→high), so we just map each message — no diff/resync handshake needed.
export const subscribeOrderBook = (symbol: string, cb: OrderBookSubscriber): (() => void) =>
    socket.subscribe<HlBook>({ coin: symbol, type: 'l2Book' }, (book) => {
        const localBook: LocalOrderBook = {
            asks: toLevels(book.levels[1]),
            bids: toLevels(book.levels[0]),
            lastUpdateId: book.time,
        };
        cb(localBook);
    });

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
