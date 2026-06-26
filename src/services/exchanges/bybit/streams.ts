import type { LocalOrderBook } from '@/routes/~chart/types';

import type { NormalizedTrade, OrderBookSubscriber, TradeSubscriber } from '../types';

import { applyLevelDeltas } from '../_shared/book-syncer';
import MultiplexedSocket from '../_shared/multiplexed-socket';

const WS_URL = 'wss://stream.bybit.com/v5/public/linear';
const PING_INTERVAL_MS = 20_000; // docs: ping every 20s
const ORDERBOOK_DEPTH = 200; // linear depths: 1 / 50 / 200 / 1000

type BybitMessage = {
    topic?: string;
    type?: 'snapshot' | 'delta';
    data?: unknown;
};

type BybitOrderBookData = {
    s: string;
    b: [string, string][];
    a: [string, string][];
    u: number;
    seq: number;
};

type BybitTrade = {
    T: number;
    s: string;
    S: 'Buy' | 'Sell';
    v: string;
    p: string;
    i: string;
};

const socket = new MultiplexedSocket<string>({
    keyOf: (topic) => topic,
    pingFrame: { op: 'ping' },
    pingIntervalMs: PING_INTERVAL_MS,
    // Data frames carry `topic`; subscribe acks and pongs don't, so they fall
    // through to [] and are ignored.
    route: (msg: any) => (typeof msg?.topic === 'string' ? [{ data: msg, key: msg.topic }] : []),
    subscribeFrame: (topic) => ({ args: [topic], op: 'subscribe' }),
    unsubscribeFrame: (topic) => ({ args: [topic], op: 'unsubscribe' }),
    url: WS_URL,
});

const orderBookStreams = new Map<string, BybitOrderBookStream>();

const orderBookKey = (symbol: string): string => `orderbook.${ORDERBOOK_DEPTH}.${symbol}`;

// Bybit pushes a full "snapshot" on (re)subscribe, then "delta" patches — so
// unlike Binance there's no REST handshake. MultiplexedSocket replays the
// subscription on reconnect, which triggers a fresh snapshot.
class BybitOrderBookStream {
    private readonly topic: string;
    private readonly subscribers = new Set<OrderBookSubscriber>();
    private readonly bids = new Map<number, number>();
    private readonly asks = new Map<number, number>();
    private socketUnsub: (() => void) | null = null;
    private latest: LocalOrderBook | null = null;

    constructor(symbol: string) {
        this.topic = orderBookKey(symbol);
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
        this.socketUnsub = socket.subscribe<BybitMessage>(this.topic, (msg) => this.onMessage(msg));
    }

    private stop(): void {
        this.socketUnsub?.();
        this.socketUnsub = null;
        this.bids.clear();
        this.asks.clear();
        this.latest = null;
        orderBookStreams.delete(this.topic);
    }

    // snapshot (or u === 1, a service restart) replaces the book; delta patches
    // it, with a size of "0" meaning the level was removed.
    private onMessage(msg: BybitMessage): void {
        const data = msg.data as BybitOrderBookData | undefined;
        if (!data) return;
        if (msg.type === 'snapshot' || data.u === 1) {
            this.bids.clear();
            this.asks.clear();
        }
        applyLevelDeltas(this.bids, data.b);
        applyLevelDeltas(this.asks, data.a);
        this.emit(data.u);
    }

    private emit(lastUpdateId: number): void {
        const book: LocalOrderBook = {
            asks: [...this.asks].sort((a, b) => a[0] - b[0]),
            bids: [...this.bids].sort((a, b) => b[0] - a[0]),
            lastUpdateId,
        };
        this.latest = book;
        for (const cb of this.subscribers) cb(book);
    }
}

export const subscribeOrderBook = (symbol: string, cb: OrderBookSubscriber): (() => void) => {
    const key = orderBookKey(symbol);
    let stream = orderBookStreams.get(key);
    if (!stream) {
        stream = new BybitOrderBookStream(symbol);
        orderBookStreams.set(key, stream);
    }
    return stream.subscribe(cb);
};

export const subscribeTrades = (symbol: string, cb: TradeSubscriber): (() => void) =>
    socket.subscribe<BybitMessage>(`publicTrade.${symbol}`, (msg) => {
        for (const t of (msg.data as BybitTrade[]) ?? []) {
            const trade: NormalizedTrade = {
                id: t.i,
                // `S` is the taker side: "Sell" => the buyer was the maker.
                isBuyerMaker: t.S === 'Sell',
                price: +t.p,
                size: +t.v,
                time: t.T,
            };
            cb(trade);
        }
    });
