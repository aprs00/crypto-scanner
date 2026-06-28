import type {
    LocalOrderBook,
    OrderBookResponseType,
    StreamAggTradeResponseType,
    StreamTickerResponseType,
} from '@/routes/~chart/types';

import { binanceInstance } from '@/lib/api';

import type { BboSubscriber, NormalizedTrade, OrderBookSubscriber, TradeSubscriber } from '../types';

import BookSyncer, { applyLevelDeltas } from '../_shared/book-syncer';
import MultiplexedSocket from '../_shared/multiplexed-socket';

const WS_URL = 'wss://stream.binance.com:9443/stream';
const SNAPSHOT_LIMIT = 5_000;

let msgId = 0;

const socket = new MultiplexedSocket<string>({
    keyOf: (key) => key,
    route: (msg: any) => {
        // Combined-stream wraps payloads as { stream, data }; acks have no stream
        // and fall through to [].
        if (typeof msg?.stream === 'string' && msg.data) {
            return [{ data: msg.data, key: msg.stream }];
        }
        return [];
    },
    subscribeFrame: (key) => ({ id: ++msgId, method: 'SUBSCRIBE', params: [key] }),
    unsubscribeFrame: (key) => ({ id: ++msgId, method: 'UNSUBSCRIBE', params: [key] }),
    url: WS_URL,
});

const orderBookStreams = new Map<string, BinanceOrderBookStream>();

const orderBookKey = (symbol: string): string => `${symbol.toLowerCase()}@depth@100ms`;

class BinanceOrderBookStream {
    private readonly streamKey: string;
    private readonly snapshotUrl: string;
    private readonly subscribers = new Set<OrderBookSubscriber>();
    private readonly syncer: BookSyncer<StreamTickerResponseType, OrderBookResponseType>;
    private socketUnsub: (() => void) | null = null;
    private latest: LocalOrderBook | null = null;

    constructor(symbol: string) {
        const lower = symbol.toLowerCase();
        this.streamKey = orderBookKey(symbol);
        this.snapshotUrl = `api/v3/depth?symbol=${lower.toUpperCase()}&limit=${SNAPSHOT_LIMIT}`;
        this.syncer = new BookSyncer<StreamTickerResponseType, OrderBookResponseType>({
            applyDiff: (diff, bids, asks) => {
                applyLevelDeltas(bids, diff.b);
                applyLevelDeltas(asks, diff.a);
            },
            diffSequence: (d) => ({ from: d.U, to: d.u }),
            fetchSnapshot: async () => {
                const { data } = await binanceInstance.get<OrderBookResponseType>(this.snapshotUrl);
                return data;
            },
            loadSnapshot: (snap, bids, asks) => {
                bids.clear();
                asks.clear();
                for (const [price, qty] of snap.bids) bids.set(+price, +qty);
                for (const [price, qty] of snap.asks) asks.set(+price, +qty);
            },
            onChange: (book) => {
                this.latest = book;
                for (const cb of this.subscribers) cb(book);
            },
            onGap: () => this.resync(),
            snapSequence: (s) => s.lastUpdateId,
        });
    }

    subscribe(cb: OrderBookSubscriber): () => void {
        this.subscribers.add(cb);
        if (this.latest) cb(this.latest);
        if (this.subscribers.size === 1) this.start();

        return () => {
            this.subscribers.delete(cb);
            if (this.subscribers.size === 0) this.stop();
        };
    }

    private start(): void {
        this.syncer.onConnect();
        this.socketUnsub = socket.subscribe<StreamTickerResponseType>(this.streamKey, (diff) =>
            this.syncer.onDiff(diff),
        );
    }

    private stop(): void {
        this.syncer.onDisconnect();
        this.socketUnsub?.();
        this.socketUnsub = null;
        this.latest = null;
        orderBookStreams.delete(this.streamKey);
    }

    // BookSyncer signals a sequence gap: drop the upstream subscription and
    // restart the state machine.
    private resync(): void {
        if (this.subscribers.size === 0) return;
        this.socketUnsub?.();
        this.syncer.onDisconnect();
        this.syncer.onConnect();
        this.socketUnsub = socket.subscribe<StreamTickerResponseType>(this.streamKey, (diff) =>
            this.syncer.onDiff(diff),
        );
    }
}

export const subscribeOrderBook = (symbol: string, cb: OrderBookSubscriber): (() => void) => {
    const key = orderBookKey(symbol);
    let stream = orderBookStreams.get(key);
    if (!stream) {
        stream = new BinanceOrderBookStream(symbol);
        orderBookStreams.set(key, stream);
    }
    return stream.subscribe(cb);
};

// Real-time best bid/ask: pushed on every top-of-book change (no 100ms throttle,
// unlike @depth). { b, a } are best bid/ask price; { B, A } their quantities.
type BinanceBookTicker = { u: number; s: string; b: string; B: string; a: string; A: string };

export const subscribeBbo = (symbol: string, cb: BboSubscriber): (() => void) =>
    socket.subscribe<BinanceBookTicker>(`${symbol.toLowerCase()}@bookTicker`, (d) => {
        cb({ ask: +d.a, bid: +d.b, time: Date.now() });
    });

export const subscribeTrades = (symbol: string, cb: TradeSubscriber): (() => void) =>
    socket.subscribe<StreamAggTradeResponseType>(`${symbol.toLowerCase()}@aggTrade`, (t) => {
        const trade: NormalizedTrade = {
            id: t.a,
            isBuyerMaker: t.m,
            price: +t.p,
            size: +t.q,
            time: t.T,
        };
        cb(trade);
    });
