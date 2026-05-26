import { binanceInstance } from '@/lib/api';
import { LocalOrderBook, OrderBookLevel, OrderBookResponseType, StreamTickerResponseType } from '@/routes/~chart/types';

type Subscriber = (orderBook: LocalOrderBook) => void;

const SNAPSHOT_LIMIT = 5000;
const RESYNC_DELAY_MS = 1000;
const EMPTY_BOOK: LocalOrderBook = { bids: [], asks: [], lastUpdateId: 0 };

class OrderBookStream {
    private static streams = new Map<string, OrderBookStream>();

    static getOrCreate(symbol: string): OrderBookStream {
        const key = symbol.toLowerCase();
        let stream = OrderBookStream.streams.get(key);
        if (!stream) {
            stream = new OrderBookStream(key);
            OrderBookStream.streams.set(key, stream);
        }
        return stream;
    }

    private readonly symbol: string;
    private ws: WebSocket | null = null;

    // Book kept as price -> quantity maps; sorted arrays are derived on emit.
    private bids = new Map<number, number>();
    private asks = new Map<number, number>();
    private lastUpdateId = 0;

    // Snapshot/diff handshake state.
    private buffer: StreamTickerResponseType[] = [];
    private synced = false;
    private snapshotPending = false;
    // Bumped on every (re)connect so messages from a stale socket and resolved
    // snapshot fetches from a previous generation are ignored — this is what
    // makes concurrent resyncs safe.
    private generation = 0;
    private resyncScheduled = false;

    private book: LocalOrderBook = EMPTY_BOOK;
    private subscribers = new Set<Subscriber>();

    private constructor(symbol: string) {
        this.symbol = symbol;
    }

    subscribe(cb: Subscriber): void {
        this.subscribers.add(cb);
        if (this.synced) cb(this.book);
        if (this.subscribers.size === 1) this.connect();
    }

    unsubscribe(cb: Subscriber): void {
        this.subscribers.delete(cb);
        if (this.subscribers.size === 0) {
            this.disconnect();
            OrderBookStream.streams.delete(this.symbol);
        }
    }

    private connect(): void {
        const generation = ++this.generation;
        this.buffer = [];
        this.synced = false;
        this.snapshotPending = false;
        this.bids.clear();
        this.asks.clear();
        this.lastUpdateId = 0;

        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${this.symbol}@depth@100ms`);
        this.ws = ws;

        ws.onmessage = (event) => {
            if (generation !== this.generation) return; // socket from a superseded connect()
            const diff: StreamTickerResponseType = JSON.parse(event.data);

            if (!this.snapshotPending && !this.synced) {
                // First diff: start buffering and kick off the snapshot fetch.
                this.snapshotPending = true;
                this.buffer.push(diff);
                this.fetchSnapshot(generation);
            } else if (!this.synced) {
                this.buffer.push(diff);
            } else {
                this.applyLive(diff);
            }
        };
    }

    private disconnect(): void {
        this.generation++; // invalidate the live socket and any in-flight snapshot fetch
        if (this.ws) {
            this.ws.onmessage = null;
            this.ws.close();
            this.ws = null;
        }
        this.buffer = [];
        this.synced = false;
        this.snapshotPending = false;
    }

    private scheduleResync(): void {
        if (this.resyncScheduled) return; // collapse bursts of gaps into one reconnect
        this.resyncScheduled = true;
        setTimeout(() => {
            this.resyncScheduled = false;
            if (this.subscribers.size === 0) return;
            this.disconnect();
            this.connect();
        }, RESYNC_DELAY_MS);
    }

    private async fetchSnapshot(generation: number): Promise<void> {
        let snapshot: OrderBookResponseType;
        try {
            const { data } = await binanceInstance.get<OrderBookResponseType>(
                `api/v3/depth?symbol=${this.symbol.toUpperCase()}&limit=${SNAPSHOT_LIMIT}`,
            );
            snapshot = data;
        } catch {
            if (generation === this.generation) this.scheduleResync();
            return;
        }
        if (generation !== this.generation) return; // a newer connect() superseded this fetch
        this.syncFromSnapshot(snapshot, generation);
    }

    private syncFromSnapshot(snapshot: OrderBookResponseType, generation: number): void {
        // Keep only buffered diffs newer than the snapshot.
        const events = this.buffer.filter((event) => event.u > snapshot.lastUpdateId);

        // The first kept diff must bridge the snapshot (U <= lastUpdateId + 1 <= u).
        // If it starts after that, the snapshot predates our buffer — fetch a fresher one.
        if (events.length > 0 && events[0].U > snapshot.lastUpdateId + 1) {
            setTimeout(() => {
                if (generation === this.generation) this.fetchSnapshot(generation);
            }, RESYNC_DELAY_MS);
            return;
        }

        this.loadSnapshot(snapshot);
        for (const event of events) this.applyDiff(event);

        this.buffer = [];
        this.synced = true;
        this.emit();
    }

    private applyLive(diff: StreamTickerResponseType): void {
        if (diff.u <= this.lastUpdateId) return; // already covered by the snapshot/prior diffs
        if (diff.U > this.lastUpdateId + 1) {
            // Sequence gap: a diff was missed, so the book can no longer be trusted.
            // Discard and resync instead of applying out-of-order data (which is what
            // makes top-of-book — and the derived mid price — jump erratically).
            this.scheduleResync();
            return;
        }
        this.applyDiff(diff);
        this.emit();
    }

    private loadSnapshot(snapshot: OrderBookResponseType): void {
        this.bids.clear();
        this.asks.clear();
        for (const [price, qty] of snapshot.bids) this.bids.set(+price, +qty);
        for (const [price, qty] of snapshot.asks) this.asks.set(+price, +qty);
        this.lastUpdateId = snapshot.lastUpdateId;
    }

    private applyDiff(diff: StreamTickerResponseType): void {
        applySide(this.bids, diff.b);
        applySide(this.asks, diff.a);
        this.lastUpdateId = diff.u;
    }

    private emit(): void {
        this.book = {
            bids: [...this.bids].sort((a, b) => b[0] - a[0]),
            asks: [...this.asks].sort((a, b) => a[0] - b[0]),
            lastUpdateId: this.lastUpdateId,
        };
        for (const cb of this.subscribers) cb(this.book);
    }
}

const applySide = (side: Map<number, number>, levels: [string, string][]): void => {
    for (const [priceStr, qtyStr] of levels) {
        const price = +priceStr;
        const qty = +qtyStr;
        if (qty === 0) side.delete(price);
        else side.set(price, qty);
    }
};

// Thin per-consumer handle. Routes through the shared per-symbol stream so N consumers share one WebSocket.
export default class BinanceOrderBookService {
    private stream: OrderBookStream;
    private callback: Subscriber;

    constructor(symbol: string, onOrderBookUpdate: Subscriber) {
        this.stream = OrderBookStream.getOrCreate(symbol);
        this.callback = onOrderBookUpdate;
    }

    public initialize(): void {
        this.stream.subscribe(this.callback);
    }

    public close(): void {
        this.stream.unsubscribe(this.callback);
    }
}

type RowCount = number | { bids: number; asks: number };

export const groupOrders = (book: LocalOrderBook, groupByVal: number, rows: RowCount) => ({
    bids: groupSide(book.bids, groupByVal, false, typeof rows === 'number' ? rows : rows.bids),
    asks: groupSide(book.asks, groupByVal, true, typeof rows === 'number' ? rows : rows.asks),
});

// Levels arrive best-first and sorted, so rounded buckets appear in order: once
// `rows` buckets are collected, every remaining level sits further from the
// touch and would only open later buckets, so we can stop early.
const groupSide = (levels: OrderBookLevel[], groupByVal: number, isAsk: boolean, rows: number): OrderBookLevel[] => {
    if (rows <= 0 || !(groupByVal > 0)) return [];
    const grouped = new Map<number, number>();

    for (const [price, qty] of levels) {
        const bucket = isAsk ? Math.floor(price / groupByVal) * groupByVal : Math.ceil(price / groupByVal) * groupByVal;
        const existing = grouped.get(bucket);
        if (existing === undefined) {
            if (grouped.size === rows) break;
            grouped.set(bucket, qty);
        } else {
            grouped.set(bucket, existing + qty);
        }
    }

    return [...grouped];
};
