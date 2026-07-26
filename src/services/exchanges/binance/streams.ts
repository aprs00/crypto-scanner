import externalServiceOrigins from '@/config/externalServices';
import { binanceFuturesInstance } from '@/lib/api';

import type {
    BboSubscriber,
    DepthCoverage,
    DepthState,
    DepthSubscriber,
    NormalizedTrade,
    TradeSubscriber,
} from '../types';
import type {
    BinanceFuturesAggregateTrade,
    BinanceFuturesBookTicker,
    BinanceFuturesDepthUpdate,
    BinanceFuturesOrderBookSnapshot,
} from './types';

import BookSyncer, { applyParsedLevelDeltas, parseLevelDeltas } from '../_shared/book-syncer';
import MultiplexedSocket, { SocketStatus } from '../_shared/multiplexed-socket';
import { DepthFeedStatus } from '../types';

export const BINANCE_FUTURES_DEPTH_SNAPSHOT_LIMIT = 1_000;
export const BINANCE_FUTURES_PUBLIC_STREAM_URL = `${externalServiceOrigins.binanceFuturesWS}/public/stream`;
export const BINANCE_FUTURES_MARKET_STREAM_URL = `${externalServiceOrigins.binanceFuturesWS}/market/stream`;
const BINANCE_COVERAGE_LOW_WATER = 650;
const BINANCE_COVERAGE_REFRESH_COOLDOWN_MS = 30_000;

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

type RetainedCoverage = {
    farPrice: number | null;
    truncated: boolean;
};

const emptyCoverage = (): DepthCoverage => ({
    asks: {
        farPrice: null,
        truncated: true,
    },
    bids: {
        farPrice: null,
        truncated: true,
    },
});

class BinanceOrderBookStream {
    private readonly symbol: string;
    private readonly streamKey: string;
    private readonly snapshotUrl: string;
    private readonly subscribers = new Set<DepthSubscriber>();
    private readonly syncer: BookSyncer<BinanceFuturesDepthUpdate, BinanceFuturesOrderBookSnapshot>;
    private socketUnsub: (() => void) | null = null;
    private socketStatusUnsub: (() => void) | null = null;
    private generation = 0;
    private bidCoverage: RetainedCoverage = { farPrice: null, truncated: true };
    private askCoverage: RetainedCoverage = { farPrice: null, truncated: true };
    private lastCoverageRefreshAt = -Infinity;
    private readonly coverageRefreshCooldownMs =
        BINANCE_COVERAGE_REFRESH_COOLDOWN_MS + Math.round(Math.random() * 5_000);
    private state: DepthState = {
        book: { asks: [], bids: [] },
        coverage: emptyCoverage(),
        generation: 0,
        status: DepthFeedStatus.Syncing,
    };

    constructor(symbol: string) {
        this.symbol = symbol.toUpperCase();
        this.streamKey = orderBookKey(symbol);
        this.snapshotUrl = binanceFuturesDepthSnapshotPath(symbol);
        this.syncer = new BookSyncer<BinanceFuturesDepthUpdate, BinanceFuturesOrderBookSnapshot>({
            applyDiff: (diff, bids, asks) => this.applyDiff(diff, bids, asks),
            bridgesSnapshot: ({ from, to }, snapshotSequence) => from <= snapshotSequence && to >= snapshotSequence,
            continuesSequence: ({ previous }, previousSequence) => previous === previousSequence,
            diffSequence: (d) => ({ from: d.U, previous: d.pu, to: d.u }),
            diffWeight: (diff) =>
                (Array.isArray(diff.a) ? diff.a.length : 1) + (Array.isArray(diff.b) ? diff.b.length : 1),
            fetchSnapshot: async () => {
                const { data } = await binanceFuturesInstance.get<BinanceFuturesOrderBookSnapshot>(this.snapshotUrl);
                return data;
            },
            isStaleSequence: ({ to }, snapshotSequence) => to < snapshotSequence,
            loadSnapshot: (snap, bids, asks) => this.loadSnapshot(snap, bids, asks),
            needsRefresh: (bids, asks) => this.needsCoverageRefresh(bids, asks),
            normalizeBook: (bids, asks) => this.enforceRetentionLimit(bids, asks),
            onChange: (book) => this.publishHealthy(book),
            onInvalid: () => this.invalidate(),
            snapSequence: (s) => s.lastUpdateId,
        });
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
            coverage: emptyCoverage(),
            generation: 0,
            status: DepthFeedStatus.Syncing,
        };
        this.generation = 0;
        this.bidCoverage = { farPrice: null, truncated: true };
        this.askCoverage = { farPrice: null, truncated: true };
        this.lastCoverageRefreshAt = -Infinity;
        if (orderBookStreams.get(this.streamKey) === this) orderBookStreams.delete(this.streamKey);
    }

    private onSocketStatus(status: SocketStatus): void {
        if (status === SocketStatus.Open) {
            this.generation++;
            this.syncer.onConnect();
            this.publishStatus(DepthFeedStatus.Syncing);
            return;
        }
        this.syncer.onDisconnect();
        this.publishStatus(status === SocketStatus.Closed ? DepthFeedStatus.Stale : DepthFeedStatus.Syncing);
    }

    private loadSnapshot(
        snapshot: BinanceFuturesOrderBookSnapshot,
        bids: Map<number, number>,
        asks: Map<number, number>,
    ): boolean {
        if (
            !Number.isSafeInteger(snapshot.lastUpdateId) ||
            snapshot.lastUpdateId < 0 ||
            !Number.isSafeInteger(snapshot.T) ||
            snapshot.T < 0
        ) {
            return false;
        }
        const parsedBids = parseLevelDeltas(snapshot.bids);
        const parsedAsks = parseLevelDeltas(snapshot.asks);
        if (
            !parsedBids ||
            !parsedAsks ||
            parsedBids.length === 0 ||
            parsedAsks.length === 0 ||
            parsedBids.length !== snapshot.bids.length ||
            parsedAsks.length !== snapshot.asks.length ||
            parsedBids.some(([, quantity]) => quantity === 0) ||
            parsedAsks.some(([, quantity]) => quantity === 0) ||
            parsedBids.length > BINANCE_FUTURES_DEPTH_SNAPSHOT_LIMIT ||
            parsedAsks.length > BINANCE_FUTURES_DEPTH_SNAPSHOT_LIMIT
        ) {
            return false;
        }

        bids.clear();
        asks.clear();
        applyParsedLevelDeltas(bids, parsedBids);
        applyParsedLevelDeltas(asks, parsedAsks);
        const sortedBids = [...bids.keys()].sort((a, b) => b - a);
        const sortedAsks = [...asks.keys()].sort((a, b) => a - b);
        this.bidCoverage = {
            farPrice: sortedBids[sortedBids.length - 1] ?? null,
            truncated: sortedBids.length === BINANCE_FUTURES_DEPTH_SNAPSHOT_LIMIT,
        };
        this.askCoverage = {
            farPrice: sortedAsks[sortedAsks.length - 1] ?? null,
            truncated: sortedAsks.length === BINANCE_FUTURES_DEPTH_SNAPSHOT_LIMIT,
        };
        return true;
    }

    private applyDiff(diff: BinanceFuturesDepthUpdate, bids: Map<number, number>, asks: Map<number, number>): boolean {
        if (
            diff.s !== this.symbol ||
            !Number.isSafeInteger(diff.T) ||
            diff.T < 0 ||
            !Number.isSafeInteger(diff.E) ||
            diff.E < 0
        ) {
            return false;
        }
        const bidChanges = parseLevelDeltas(diff.b);
        const askChanges = parseLevelDeltas(diff.a);
        if (!bidChanges || !askChanges) return false;

        const bidFloor = this.bidCoverage.farPrice;
        const askCeiling = this.askCoverage.farPrice;
        applyParsedLevelDeltas(
            bids,
            bidChanges,
            (price) => !this.bidCoverage.truncated || bidFloor === null || price >= bidFloor,
        );
        applyParsedLevelDeltas(
            asks,
            askChanges,
            (price) => !this.askCoverage.truncated || askCeiling === null || price <= askCeiling,
        );
        return true;
    }

    private enforceRetentionLimit(bids: Map<number, number>, asks: Map<number, number>): boolean {
        this.bidCoverage = this.capSide(bids, true, this.bidCoverage);
        this.askCoverage = this.capSide(asks, false, this.askCoverage);
        return bids.size > 0 && asks.size > 0;
    }

    private capSide(side: Map<number, number>, isBid: boolean, coverage: RetainedCoverage): RetainedCoverage {
        if (side.size <= BINANCE_FUTURES_DEPTH_SNAPSHOT_LIMIT) return coverage;
        const prices = [...side.keys()].sort((a, b) => (isBid ? b - a : a - b));
        for (let index = BINANCE_FUTURES_DEPTH_SNAPSHOT_LIMIT; index < prices.length; index++) {
            side.delete(prices[index]);
        }
        return {
            farPrice: prices[BINANCE_FUTURES_DEPTH_SNAPSHOT_LIMIT - 1] ?? coverage.farPrice,
            truncated: true,
        };
    }

    private needsCoverageRefresh(bids: ReadonlyMap<number, number>, asks: ReadonlyMap<number, number>): boolean {
        const depleted =
            (this.bidCoverage.truncated && bids.size <= BINANCE_COVERAGE_LOW_WATER) ||
            (this.askCoverage.truncated && asks.size <= BINANCE_COVERAGE_LOW_WATER);
        if (!depleted || Date.now() - this.lastCoverageRefreshAt < this.coverageRefreshCooldownMs) return false;
        this.lastCoverageRefreshAt = Date.now();
        return true;
    }

    private currentCoverage(): DepthCoverage {
        return {
            asks: {
                farPrice: this.askCoverage.farPrice,
                truncated: this.askCoverage.truncated,
            },
            bids: {
                farPrice: this.bidCoverage.farPrice,
                truncated: this.bidCoverage.truncated,
            },
        };
    }

    private invalidate(): void {
        if (this.state.status === DepthFeedStatus.Healthy) this.generation++;
        this.publishStatus(DepthFeedStatus.Syncing);
    }

    private publishHealthy(book: DepthState['book']): void {
        this.state = {
            book,
            coverage: this.currentCoverage(),
            generation: this.generation,
            status: DepthFeedStatus.Healthy,
        };
        this.notify();
    }

    private publishStatus(status: DepthState['status']): void {
        this.state = {
            ...this.state,
            generation: this.generation,
            status,
        };
        this.notify();
    }

    private notify(): void {
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
