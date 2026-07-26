import externalServiceOrigins from '@/config/externalServices';

import type {
    BboSubscriber,
    DepthCoverage,
    DepthState,
    DepthSubscriber,
    LocalOrderBook,
    NormalizedTrade,
    OrderBookLevel,
    TradeSubscriber,
} from '../types';

import MultiplexedSocket, { SocketStatus } from '../_shared/multiplexed-socket';
import { DepthFeedStatus } from '../types';

const WS_URL = `${externalServiceOrigins.hyperliquidWS}/ws`;
const PING_INTERVAL_MS = 30_000; // server drops idle sockets ~60s
const ORDERBOOK_DEPTH = 20;

export const HlChannel = {
    L2Book: 'l2Book',
    Trades: 'trades',
    Bbo: 'bbo',
} as const;
export type HlChannel = (typeof HlChannel)[keyof typeof HlChannel];

type HlSub = { type: HlChannel; coin: string };
type HlLevel = { px: string; sz: string; n: number };
type HlBook = { coin: string; time: number; levels: [HlLevel[], HlLevel[]] };
type HlBbo = { coin: string; time: number; bbo: [HlLevel | null, HlLevel | null] };
type HlTrade = { coin: string; side: string; px: string; sz: string; time: number; tid: number };

const toLevels = (levels: unknown): OrderBookLevel[] | null => {
    if (!Array.isArray(levels)) return null;
    const parsed = new Map<number, number>();
    for (const level of levels) {
        if (
            !level ||
            typeof level !== 'object' ||
            !('px' in level) ||
            !('sz' in level) ||
            !('n' in level) ||
            typeof level.px !== 'string' ||
            typeof level.sz !== 'string' ||
            !Number.isSafeInteger(level.n) ||
            level.n < 0
        ) {
            return null;
        }
        const price = Number(level.px);
        const quantity = Number(level.sz);
        if (!Number.isFinite(price) || !Number.isFinite(quantity) || price <= 0 || quantity <= 0) return null;
        if (parsed.has(price)) return null;
        parsed.set(price, quantity);
    }
    return [...parsed];
};

const bookKey = (coin: string) => `l2Book:${coin}`;

const socket = new MultiplexedSocket<HlSub>({
    keyOf: (sub) => (sub.type === HlChannel.L2Book ? bookKey(sub.coin) : `${sub.type}:${sub.coin}`),
    pingFrame: { method: 'ping' },
    pingIntervalMs: PING_INTERVAL_MS,
    route: (msg: any) => {
        if (msg?.channel === HlChannel.L2Book && msg.data?.coin) {
            return [{ data: msg.data, key: bookKey(msg.data.coin) }];
        }
        if (msg?.channel === HlChannel.Trades) {
            // trades payload is an array; route by the coin of the first trade.
            const coin = msg.data?.[0]?.coin;
            if (coin) return [{ data: msg.data, key: `${HlChannel.Trades}:${coin}` }];
        }
        if (msg?.channel === HlChannel.Bbo && msg.data?.coin) {
            return [{ data: msg.data, key: `${HlChannel.Bbo}:${msg.data.coin}` }];
        }
        return [];
    },
    subscribeFrame: (sub) => ({ method: 'subscribe', subscription: sub }),
    unsubscribeFrame: (sub) => ({ method: 'unsubscribe', subscription: sub }),
    url: WS_URL,
});

const toLocal = (book: HlBook): LocalOrderBook | null => {
    const asks = toLevels(book.levels[1]);
    const bids = toLevels(book.levels[0]);
    if (!asks || !bids) return null;
    asks.sort((a, b) => a[0] - b[0]);
    bids.sort((a, b) => b[0] - a[0]);
    return {
        asks: asks.slice(0, ORDERBOOK_DEPTH),
        bids: bids.slice(0, ORDERBOOK_DEPTH),
    };
};

const orderBookStreams = new Map<string, HyperliquidOrderBookStream>();

const emptyCoverage = (): DepthCoverage => ({
    asks: { farPrice: null, truncated: true },
    bids: { farPrice: null, truncated: true },
});

class HyperliquidOrderBookStream {
    private readonly symbol: string;
    private readonly subscribers = new Set<DepthSubscriber>();
    private offBook: (() => void) | null = null;
    private offStatus: (() => void) | null = null;
    private generation = 0;
    private state: DepthState = {
        book: { asks: [], bids: [] },
        coverage: emptyCoverage(),
        generation: 0,
        status: DepthFeedStatus.Syncing,
    };

    constructor(symbol: string) {
        this.symbol = symbol;
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
        this.offBook = socket.subscribe<HlBook>({ coin: this.symbol, type: HlChannel.L2Book }, (book) =>
            this.onBook(book),
        );
        this.offStatus = socket.subscribeStatus((status) => this.onSocketStatus(status));
    }

    private stop(): void {
        this.offStatus?.();
        this.offBook?.();
        this.offStatus = null;
        this.offBook = null;
        this.generation = 0;
        this.state = {
            book: { asks: [], bids: [] },
            coverage: emptyCoverage(),
            generation: 0,
            status: DepthFeedStatus.Syncing,
        };
        if (orderBookStreams.get(this.symbol) === this) orderBookStreams.delete(this.symbol);
    }

    private onSocketStatus(status: SocketStatus): void {
        if (status === SocketStatus.Open) {
            this.generation++;
            this.publishStatus(DepthFeedStatus.Syncing);
            return;
        }
        this.publishStatus(status === SocketStatus.Closed ? DepthFeedStatus.Stale : DepthFeedStatus.Syncing);
    }

    private onBook(source: HlBook): void {
        if (
            !source ||
            typeof source !== 'object' ||
            source.coin !== this.symbol ||
            !Number.isSafeInteger(source.time) ||
            source.time < 0 ||
            !Array.isArray(source.levels) ||
            source.levels.length !== 2
        ) {
            this.invalidate();
            return;
        }
        const book = toLocal(source);
        if (
            !book ||
            !book.asks.length ||
            !book.bids.length ||
            !Number.isFinite(book.asks[0][0]) ||
            !Number.isFinite(book.bids[0][0]) ||
            book.asks[0][0] <= book.bids[0][0]
        ) {
            this.invalidate();
            return;
        }
        const coverage: DepthCoverage = {
            asks: {
                farPrice: book.asks[book.asks.length - 1]?.[0] ?? null,
                truncated: book.asks.length >= ORDERBOOK_DEPTH,
            },
            bids: {
                farPrice: book.bids[book.bids.length - 1]?.[0] ?? null,
                truncated: book.bids.length >= ORDERBOOK_DEPTH,
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

    private publishStatus(status: DepthState['status']): void {
        this.state = { ...this.state, generation: this.generation, status };
        this.notify();
    }

    private invalidate(): void {
        if (this.state.status === DepthFeedStatus.Healthy) this.generation++;
        this.publishStatus(DepthFeedStatus.Syncing);
    }

    private notify(): void {
        for (const cb of this.subscribers) cb(this.state);
    }
}

export const subscribeDepth = (symbol: string, cb: DepthSubscriber): (() => void) => {
    let stream = orderBookStreams.get(symbol);
    if (!stream) {
        stream = new HyperliquidOrderBookStream(symbol);
        orderBookStreams.set(symbol, stream);
    }
    return stream.subscribe(cb);
};

// Real-time best bid/offer: pushed whenever the BBO changes on a block — far
// fresher than the ~2/s l2Book, so the tick chart line tracks trades. `bbo` is
// [bid, ask]; either side can be null when that side is empty.
export const subscribeBbo = (symbol: string, cb: BboSubscriber): (() => void) =>
    socket.subscribe<HlBbo>({ coin: symbol, type: HlChannel.Bbo }, (data) => {
        const bid = data.bbo[0];
        const ask = data.bbo[1];
        if (bid && ask) cb({ ask: +ask.px, bid: +bid.px, time: Date.now() });
    });

export const subscribeTrades = (symbol: string, cb: TradeSubscriber): (() => void) =>
    socket.subscribe<HlTrade[]>({ coin: symbol, type: HlChannel.Trades }, (trades) => {
        for (const t of trades) {
            const trade: NormalizedTrade = {
                id: t.tid,
                // HL `side` is the aggressor side; "A" (sold / hit the bid) ≈ Binance buyer-is-maker.
                isBuyerMaker: t.side === 'A',
                price: +t.px,
                size: +t.sz,
                time: t.time,
            };
            cb(trade);
        }
    });
