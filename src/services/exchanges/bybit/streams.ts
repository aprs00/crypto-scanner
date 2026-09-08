import externalServiceOrigins from '@/config/externalServices';
import MultiplexedSocket, { SocketStatus } from '@/lib/realtime/MultiplexedSocket';

import type {
    BboSubscriber,
    DepthCoverage,
    DepthState,
    DepthSubscriber,
    LocalOrderBook,
    NormalizedTrade,
    TradeSubscriber,
} from '../types';

import { applyParsedLevelDeltas, parseLevelDeltas } from '../internal/bookSyncer';
import { DepthFeedStatus } from '../types';

const WS_URL = `${externalServiceOrigins.bybitWS}/v5/public/linear`;
const PING_INTERVAL_MS = 20_000; // docs: ping every 20s
const ORDERBOOK_DEPTH = 1_000; // enough source depth to populate 512 storage buckets per side
const RECOVERY_BASE_DELAY_MS = 1_000;
const RECOVERY_MAX_DELAY_MS = 8_000;
const RECOVERY_MAX_EXPONENT = 3;

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

const emptyCoverage = (): DepthCoverage => ({
    asks: { farPrice: null, truncated: true },
    bids: { farPrice: null, truncated: true },
});

// Bybit pushes a full "snapshot" on (re)subscribe, then "delta" patches — so
// unlike Binance there's no REST handshake. MultiplexedSocket replays the
// subscription on reconnect, which triggers a fresh snapshot.
class BybitOrderBookStream {
    private readonly symbol: string;
    private readonly topic: string;
    private readonly subscribers = new Set<DepthSubscriber>();
    private readonly bids = new Map<number, number>();
    private readonly asks = new Map<number, number>();
    private socketUnsub: (() => void) | null = null;
    private socketStatusUnsub: (() => void) | null = null;
    private lastUpdateId = 0;
    private lastSequence = 0;
    private generation = 0;
    private recoveryAttempt = 0;
    private recoveryTimer: ReturnType<typeof setTimeout> | null = null;
    private state: DepthState = {
        book: { asks: [], bids: [] },
        coverage: emptyCoverage(),
        generation: 0,
        status: DepthFeedStatus.Syncing,
    };

    constructor(symbol: string) {
        this.symbol = symbol.toUpperCase();
        this.topic = orderBookKey(this.symbol);
    }

    subscribe(cb: DepthSubscriber): () => void {
        const subscriber: DepthSubscriber = (state) => cb(state);
        this.subscribers.add(subscriber);
        subscriber(this.state);
        if (this.subscribers.size === 1) this.start();

        let active = true;
        return () => {
            if (!active) return;
            active = false;
            this.subscribers.delete(subscriber);
            if (this.subscribers.size === 0) this.stop();
        };
    }

    private start(): void {
        this.socketUnsub = socket.subscribe<BybitMessage>(this.topic, (msg) => this.onMessage(msg));
        this.socketStatusUnsub = socket.subscribeStatus((status) => this.onSocketStatus(status));
    }

    private stop(): void {
        this.cancelRecovery(true);
        this.socketStatusUnsub?.();
        this.socketStatusUnsub = null;
        this.socketUnsub?.();
        this.socketUnsub = null;
        this.bids.clear();
        this.asks.clear();
        this.lastUpdateId = 0;
        this.lastSequence = 0;
        this.generation = 0;
        this.state = {
            book: { asks: [], bids: [] },
            coverage: emptyCoverage(),
            generation: 0,
            status: DepthFeedStatus.Syncing,
        };
        if (orderBookStreams.get(this.topic) === this) orderBookStreams.delete(this.topic);
    }

    // snapshot (or u === 1, a service restart) replaces the book; delta patches
    // it, with a size of "0" meaning the level was removed.
    private onMessage(msg: BybitMessage): void {
        const data = msg.data as BybitOrderBookData | undefined;
        if (
            !data ||
            !Number.isSafeInteger(data.u) ||
            data.u < 1 ||
            !Number.isSafeInteger(data.seq) ||
            data.seq < 1 ||
            data.s !== this.symbol ||
            (msg.type !== 'snapshot' && msg.type !== 'delta')
        ) {
            this.recover();
            return;
        }
        const replacement = msg.type === 'snapshot' || data.u === 1;
        if (replacement) {
            if (this.state.status === DepthFeedStatus.Healthy) this.generation++;
            this.bids.clear();
            this.asks.clear();
            this.lastUpdateId = 0;
            this.lastSequence = 0;
        } else if (this.state.status !== DepthFeedStatus.Healthy) {
            return;
        } else if (data.u <= this.lastUpdateId && data.seq <= this.lastSequence) {
            // The standard fixed-depth contract documents update IDs and cross
            // sequence ordering, but unlike Bybit's separate full-depth feed it
            // does not promise that `u` is consecutive. Ignore stale frames
            // rather than forcing a resubscribe on a legitimate jump.
            return;
        } else if (data.u <= this.lastUpdateId || data.seq < this.lastSequence) {
            // One ordering field moving backward while the other moves forward
            // cannot be reconciled safely.
            this.recover();
            return;
        }
        const bidChanges = parseLevelDeltas(data.b);
        const askChanges = parseLevelDeltas(data.a);
        if (!bidChanges || !askChanges) {
            this.recover();
            return;
        }
        applyParsedLevelDeltas(this.bids, bidChanges);
        applyParsedLevelDeltas(this.asks, askChanges);
        this.lastUpdateId = data.u;
        this.lastSequence = data.seq;
        this.emit();
    }

    private emit(): void {
        const asks = [...this.asks].sort((a, b) => a[0] - b[0]);
        const bids = [...this.bids].sort((a, b) => b[0] - a[0]);
        if (asks.length > ORDERBOOK_DEPTH) {
            for (let index = ORDERBOOK_DEPTH; index < asks.length; index++) this.asks.delete(asks[index][0]);
            asks.length = ORDERBOOK_DEPTH;
        }
        if (bids.length > ORDERBOOK_DEPTH) {
            for (let index = ORDERBOOK_DEPTH; index < bids.length; index++) this.bids.delete(bids[index][0]);
            bids.length = ORDERBOOK_DEPTH;
        }
        if (!asks.length || !bids.length || asks[0][0] <= bids[0][0]) {
            this.recover();
            return;
        }
        this.cancelRecovery(true);
        const book: LocalOrderBook = {
            asks,
            bids,
        };
        const coverage: DepthCoverage = {
            asks: {
                farPrice: asks[asks.length - 1]?.[0] ?? null,
                truncated: asks.length >= ORDERBOOK_DEPTH,
            },
            bids: {
                farPrice: bids[bids.length - 1]?.[0] ?? null,
                truncated: bids.length >= ORDERBOOK_DEPTH,
            },
        };
        this.state = {
            book,
            coverage,
            generation: this.generation,
            status: DepthFeedStatus.Healthy,
        };
        this.notify();
    }

    private onSocketStatus(status: SocketStatus): void {
        this.cancelRecovery(false);
        if (status === SocketStatus.Open) {
            this.bids.clear();
            this.asks.clear();
            this.lastUpdateId = 0;
            this.lastSequence = 0;
            this.generation++;
            this.publishStatus(DepthFeedStatus.Syncing);
            return;
        }
        this.publishStatus(status === SocketStatus.Closed ? DepthFeedStatus.Stale : DepthFeedStatus.Syncing);
    }

    private recover(): void {
        if (this.subscribers.size === 0 || this.recoveryTimer !== null) return;
        this.bids.clear();
        this.asks.clear();
        this.lastUpdateId = 0;
        this.lastSequence = 0;
        this.generation++;
        this.publishStatus(DepthFeedStatus.Syncing);
        const delay = Math.min(
            RECOVERY_MAX_DELAY_MS,
            RECOVERY_BASE_DELAY_MS * 2 ** Math.min(this.recoveryAttempt, RECOVERY_MAX_EXPONENT),
        );
        this.recoveryAttempt = Math.min(this.recoveryAttempt + 1, RECOVERY_MAX_EXPONENT);
        this.recoveryTimer = setTimeout(() => {
            this.recoveryTimer = null;
            if (this.subscribers.size === 0) return;
            this.socketUnsub?.();
            this.socketUnsub = socket.subscribe<BybitMessage>(this.topic, (msg) => this.onMessage(msg));
        }, delay);
    }

    private cancelRecovery(resetAttempt: boolean): void {
        if (this.recoveryTimer !== null) clearTimeout(this.recoveryTimer);
        this.recoveryTimer = null;
        if (resetAttempt) this.recoveryAttempt = 0;
    }

    private publishStatus(status: DepthState['status']): void {
        this.state = { ...this.state, generation: this.generation, status };
        this.notify();
    }

    private notify(): void {
        for (const cb of this.subscribers) cb(this.state);
    }
}

export const subscribeDepth = (symbol: string, cb: DepthSubscriber): (() => void) => {
    const normalizedSymbol = symbol.toUpperCase();
    const key = orderBookKey(normalizedSymbol);
    let stream = orderBookStreams.get(key);
    if (!stream) {
        stream = new BybitOrderBookStream(normalizedSymbol);
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
        const bidChanges = parseLevelDeltas(data.b);
        const askChanges = parseLevelDeltas(data.a);
        if (!bidChanges || !askChanges) return;
        applyParsedLevelDeltas(bids, bidChanges);
        applyParsedLevelDeltas(asks, askChanges);
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
