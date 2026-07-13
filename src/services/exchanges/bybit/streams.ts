import type { LocalOrderBook } from '@/routes/~chart/types';

import externalServiceOrigins from '@/config/externalServices';

import type { BboSubscriber, DepthState, DepthSubscriber, NormalizedTrade, TradeSubscriber } from '../types';

import { applyLevelDeltas } from '../_shared/book-syncer';
import MultiplexedSocket, { SocketStatus } from '../_shared/multiplexed-socket';
import { DepthFeedStatus } from '../types';

const WS_URL = `${externalServiceOrigins.bybitWS}/v5/public/linear`;
const PING_INTERVAL_MS = 20_000; // docs: ping every 20s
const ORDERBOOK_DEPTH = 1_000; // enough source depth to populate 512 storage buckets per side

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
    private readonly subscribers = new Set<DepthSubscriber>();
    private readonly bids = new Map<number, number>();
    private readonly asks = new Map<number, number>();
    private socketUnsub: (() => void) | null = null;
    private socketStatusUnsub: (() => void) | null = null;
    private lastUpdateId = 0;
    private state: DepthState = {
        book: { asks: [], bids: [] },
        status: DepthFeedStatus.Syncing,
    };

    constructor(symbol: string) {
        this.topic = orderBookKey(symbol);
    }

    subscribe(cb: DepthSubscriber): () => void {
        this.subscribers.add(cb);
        cb(this.state);
        if (this.subscribers.size === 1) this.start();

        return () => {
            this.subscribers.delete(cb);
            if (this.subscribers.size === 0) this.stop();
        };
    }

    private start(): void {
        this.socketUnsub = socket.subscribe<BybitMessage>(this.topic, (msg) => this.onMessage(msg));
        this.socketStatusUnsub = socket.subscribeStatus((status) => this.onSocketStatus(status));
    }

    private stop(): void {
        this.socketStatusUnsub?.();
        this.socketStatusUnsub = null;
        this.socketUnsub?.();
        this.socketUnsub = null;
        this.bids.clear();
        this.asks.clear();
        this.lastUpdateId = 0;
        this.state = {
            book: { asks: [], bids: [] },
            status: DepthFeedStatus.Syncing,
        };
        orderBookStreams.delete(this.topic);
    }

    // snapshot (or u === 1, a service restart) replaces the book; delta patches
    // it, with a size of "0" meaning the level was removed.
    private onMessage(msg: BybitMessage): void {
        const data = msg.data as BybitOrderBookData | undefined;
        if (!data || !Number.isSafeInteger(data.u) || data.u < 1) return;
        if (msg.type === 'snapshot' || data.u === 1) {
            this.bids.clear();
            this.asks.clear();
        } else if (this.state.status !== DepthFeedStatus.Healthy) {
            return;
        } else if (data.u !== this.lastUpdateId + 1) {
            this.recover();
            return;
        }
        applyLevelDeltas(this.bids, data.b);
        applyLevelDeltas(this.asks, data.a);
        this.lastUpdateId = data.u;
        this.emit();
    }

    private emit(): void {
        const asks = [...this.asks].sort((a, b) => a[0] - b[0]);
        const bids = [...this.bids].sort((a, b) => b[0] - a[0]);
        if (!asks.length || !bids.length || asks[0][0] <= bids[0][0]) {
            this.recover();
            return;
        }
        const book: LocalOrderBook = {
            asks,
            bids,
        };
        this.publish(DepthFeedStatus.Healthy, book);
    }

    private onSocketStatus(status: SocketStatus): void {
        if (status === SocketStatus.Open) {
            this.bids.clear();
            this.asks.clear();
            this.lastUpdateId = 0;
            this.publish(DepthFeedStatus.Syncing);
            return;
        }
        this.publish(status === SocketStatus.Closed ? DepthFeedStatus.Stale : DepthFeedStatus.Syncing);
    }

    private recover(): void {
        if (this.subscribers.size === 0) return;
        this.bids.clear();
        this.asks.clear();
        this.lastUpdateId = 0;
        this.publish(DepthFeedStatus.Syncing);
        this.socketUnsub?.();
        this.socketUnsub = socket.subscribe<BybitMessage>(this.topic, (msg) => this.onMessage(msg));
    }

    private publish(status: DepthState['status'], book = this.state.book): void {
        this.state = { book, status };
        for (const cb of this.subscribers) cb(this.state);
    }
}

export const subscribeDepth = (symbol: string, cb: DepthSubscriber): (() => void) => {
    const key = orderBookKey(symbol);
    let stream = orderBookStreams.get(key);
    if (!stream) {
        stream = new BybitOrderBookStream(symbol);
        orderBookStreams.set(key, stream);
    }
    return stream.subscribe(cb);
};

// Real-time top-of-book via the level-1 book (~10ms on linear). Same snapshot+delta
// shape as the depth book, just one level — maintain best bid/ask and emit on change.
export const subscribeBbo = (symbol: string, cb: BboSubscriber): (() => void) => {
    const bids = new Map<number, number>();
    const asks = new Map<number, number>();
    return socket.subscribe<BybitMessage>(`orderbook.1.${symbol}`, (msg) => {
        const data = msg.data as BybitOrderBookData | undefined;
        if (!data) return;
        if (msg.type === 'snapshot' || data.u === 1) {
            bids.clear();
            asks.clear();
        }
        applyLevelDeltas(bids, data.b);
        applyLevelDeltas(asks, data.a);
        let bid = -Infinity;
        for (const px of bids.keys()) if (px > bid) bid = px;
        let ask = Infinity;
        for (const px of asks.keys()) if (px < ask) ask = px;
        if (bid > -Infinity && ask < Infinity) cb({ ask, bid, time: Date.now() });
    });
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
