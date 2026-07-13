import externalServiceOrigins from '@/config/externalServices';
import { binanceFuturesInstance } from '@/lib/api';

import type { BboSubscriber, DepthState, DepthSubscriber, NormalizedTrade, TradeSubscriber } from '../types';
import type {
    BinanceFuturesAggregateTrade,
    BinanceFuturesBookTicker,
    BinanceFuturesDepthUpdate,
    BinanceFuturesOrderBookSnapshot,
} from './types';

import BookSyncer, { applyLevelDeltas } from '../_shared/book-syncer';
import MultiplexedSocket, { SocketStatus } from '../_shared/multiplexed-socket';
import { DepthFeedStatus } from '../types';

export const BINANCE_FUTURES_DEPTH_SNAPSHOT_LIMIT = 1_000;
export const BINANCE_FUTURES_PUBLIC_STREAM_URL = `${externalServiceOrigins.binanceFuturesWS}/public/stream`;
export const BINANCE_FUTURES_MARKET_STREAM_URL = `${externalServiceOrigins.binanceFuturesWS}/market/stream`;

export const binanceFuturesDepthSnapshotPath = (symbol: string): string =>
    `/fapi/v1/depth?symbol=${symbol.toUpperCase()}&limit=${BINANCE_FUTURES_DEPTH_SNAPSHOT_LIMIT}`;

let msgId = 0;

const createSocket = (url: string) =>
    new MultiplexedSocket<string>({
        keyOf: (key) => key,
        route: (msg: any) => {
            if (typeof msg?.stream === 'string' && msg.data) {
                return [{ data: msg.data, key: msg.stream }];
            }
            return [];
        },
        subscribeFrame: (key) => ({ id: String(++msgId), method: 'SUBSCRIBE', params: [key] }),
        unsubscribeFrame: (key) => ({ id: String(++msgId), method: 'UNSUBSCRIBE', params: [key] }),
        url,
    });

const publicSocket = createSocket(BINANCE_FUTURES_PUBLIC_STREAM_URL);
const marketSocket = createSocket(BINANCE_FUTURES_MARKET_STREAM_URL);

const orderBookStreams = new Map<string, BinanceOrderBookStream>();

const orderBookKey = (symbol: string): string => `${symbol.toLowerCase()}@depth@100ms`;

class BinanceOrderBookStream {
    private readonly streamKey: string;
    private readonly snapshotUrl: string;
    private readonly subscribers = new Set<DepthSubscriber>();
    private readonly syncer: BookSyncer<BinanceFuturesDepthUpdate, BinanceFuturesOrderBookSnapshot>;
    private socketUnsub: (() => void) | null = null;
    private socketStatusUnsub: (() => void) | null = null;
    private state: DepthState = {
        book: { asks: [], bids: [] },
        status: DepthFeedStatus.Syncing,
    };

    constructor(symbol: string) {
        this.streamKey = orderBookKey(symbol);
        this.snapshotUrl = binanceFuturesDepthSnapshotPath(symbol);
        this.syncer = new BookSyncer<BinanceFuturesDepthUpdate, BinanceFuturesOrderBookSnapshot>({
            applyDiff: (diff, bids, asks) => {
                applyLevelDeltas(bids, diff.b);
                applyLevelDeltas(asks, diff.a);
            },
            bridgesSnapshot: ({ from, to }, snapshotSequence) => from <= snapshotSequence && to >= snapshotSequence,
            continuesSequence: ({ previous }, previousSequence) => previous === previousSequence,
            diffSequence: (d) => ({ from: d.U, previous: d.pu, to: d.u }),
            fetchSnapshot: async () => {
                const { data } = await binanceFuturesInstance.get<BinanceFuturesOrderBookSnapshot>(this.snapshotUrl);
                return data;
            },
            isStaleSequence: ({ to }, snapshotSequence) => to < snapshotSequence,
            loadSnapshot: (snap, bids, asks) => {
                bids.clear();
                asks.clear();
                applyLevelDeltas(bids, snap.bids);
                applyLevelDeltas(asks, snap.asks);
            },
            onChange: (book) => {
                this.publish(DepthFeedStatus.Healthy, book);
            },
            onGap: () => this.resync(),
            onInvalid: () => this.publish(DepthFeedStatus.Syncing),
            snapSequence: (s) => s.lastUpdateId,
        });
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
        this.socketUnsub = publicSocket.subscribe<BinanceFuturesDepthUpdate>(this.streamKey, (diff) =>
            this.syncer.onDiff(diff),
        );
        this.socketStatusUnsub = publicSocket.subscribeStatus((status) => this.onSocketStatus(status));
    }

    private stop(): void {
        this.syncer.onDisconnect();
        this.socketStatusUnsub?.();
        this.socketStatusUnsub = null;
        this.socketUnsub?.();
        this.socketUnsub = null;
        this.state = {
            book: { asks: [], bids: [] },
            status: DepthFeedStatus.Syncing,
        };
        orderBookStreams.delete(this.streamKey);
    }

    // BookSyncer signals a sequence gap: drop the upstream subscription and
    // restart the state machine.
    private resync(): void {
        if (this.subscribers.size === 0) return;
        this.publish(DepthFeedStatus.Syncing);
        this.socketUnsub?.();
        this.syncer.onDisconnect();
        this.syncer.onConnect();
        this.socketUnsub = publicSocket.subscribe<BinanceFuturesDepthUpdate>(this.streamKey, (diff) =>
            this.syncer.onDiff(diff),
        );
    }

    private onSocketStatus(status: SocketStatus): void {
        if (status === SocketStatus.Open) {
            this.syncer.onConnect();
            this.publish(DepthFeedStatus.Syncing);
            return;
        }
        this.syncer.onDisconnect();
        this.publish(status === SocketStatus.Closed ? DepthFeedStatus.Stale : DepthFeedStatus.Syncing);
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
        stream = new BinanceOrderBookStream(symbol);
        orderBookStreams.set(key, stream);
    }
    return stream.subscribe(cb);
};

export const normalizeBinanceFuturesBookTicker = (ticker: BinanceFuturesBookTicker) => {
    const ask = Number(ticker.a);
    const bid = Number(ticker.b);
    if (!Number.isFinite(ask) || !Number.isFinite(bid) || bid <= 0 || ask <= bid) return null;
    return { ask, bid, time: ticker.T };
};

export const normalizeBinanceFuturesAggregateTrade = (trade: BinanceFuturesAggregateTrade): NormalizedTrade | null => {
    const price = Number(trade.p);
    const size = Number(trade.q);
    if (!Number.isFinite(price) || !Number.isFinite(size) || price <= 0 || size <= 0) return null;
    return {
        id: trade.a,
        isBuyerMaker: trade.m,
        price,
        size,
        time: trade.T,
    };
};

export const subscribeBbo = (symbol: string, cb: BboSubscriber): (() => void) =>
    publicSocket.subscribe<BinanceFuturesBookTicker>(`${symbol.toLowerCase()}@bookTicker`, (ticker) => {
        const bbo = normalizeBinanceFuturesBookTicker(ticker);
        if (bbo) cb(bbo);
    });

export const subscribeTrades = (symbol: string, cb: TradeSubscriber): (() => void) =>
    marketSocket.subscribe<BinanceFuturesAggregateTrade>(`${symbol.toLowerCase()}@aggTrade`, (event) => {
        const trade = normalizeBinanceFuturesAggregateTrade(event);
        if (trade) cb(trade);
    });
