import type { DepthState, DepthFeedStatus } from '@/services/exchanges/types';

import { receiptTimestamp } from '@/lib/time/observedClock';
import { DepthFeedStatus as FeedStatus } from '@/services/exchanges/types';

import type { LocalOrderBook, OrderBookLevel } from '../shared/settings/types';

export const LIQUIDITY_BUCKETS_PER_SIDE = 512;
const LIQUIDITY_HISTORY_CAPACITY = 10_000;
const LIQUIDITY_SAMPLE_INTERVAL_MS = 250;
const LIQUIDITY_VALUES_PER_SAMPLE = LIQUIDITY_BUCKETS_PER_SIDE * 2;
export const MAX_MIN_NOTIONAL = 1_000_000_000_000;
const MAX_FLOAT32 = 3.4028234663852886e38;

export const LiquiditySide = {
    Ask: 'ask',
    Bid: 'bid',
} as const;
export type LiquiditySide = (typeof LiquiditySide)[keyof typeof LiquiditySide];

export type LiquidityGap = Readonly<{ end: number | null; start: number }>;

export type LiquidityProjection = Readonly<{
    askAnchor: number;
    bidAnchor: number;
    bucketTicks: number;
    values: Float32Array;
}>;

export type LiquiditySampleView = Readonly<{
    askAnchor: number;
    bidAnchor: number;
    offset: number;
    t: number;
    values: Float32Array;
}>;

const validLevel = ([price, quantity]: OrderBookLevel): boolean =>
    Number.isFinite(price) && Number.isFinite(quantity) && price > 0 && quantity > 0;

const stableInteger = (value: number): number | null => {
    if (!Number.isFinite(value)) return null;
    const rounded = Math.round(value);
    const tolerance = Math.min(0.001, Math.max(1, Math.abs(value)) * Number.EPSILON * 16);
    return Math.abs(value - rounded) <= tolerance ? rounded : null;
};

const stableCeil = (value: number): number => stableInteger(value) ?? Math.ceil(value);
const stableFloor = (value: number): number => stableInteger(value) ?? Math.floor(value);

// Smallest 1/2/5/10 × 10^n integer tick count at least as wide as the target.
const storageBucketTicks = (midpoint: number, tickSize: number): number => {
    if (!Number.isFinite(midpoint) || !Number.isFinite(tickSize) || midpoint <= 0 || tickSize <= 0) return 0;
    const targetTicks = Math.max(1, (midpoint * 0.00002) / tickSize);
    const magnitude = 10 ** Math.floor(Math.log10(targetTicks));
    const normalized = targetTicks / magnitude;
    const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    const ticks = multiplier * magnitude;
    return Number.isSafeInteger(ticks) && ticks > 0 ? ticks : 0;
};

const bestPrices = (book: LocalOrderBook): { ask: number; bid: number } | null => {
    // LocalOrderBook guarantees best-first sorting. Skipping malformed leading
    // levels is enough; the full level scan below is reserved for accepted samples.
    const bid = book.bids.find(validLevel)?.[0];
    const ask = book.asks.find(validLevel)?.[0];
    return bid && ask && ask > bid ? { ask, bid } : null;
};

const bucketCoordinate = (price: number, tickSize: number, bucketTicks: number, ask: boolean): number => {
    const tickCoordinate = price / tickSize;
    const alignedTick = stableInteger(tickCoordinate) ?? tickCoordinate;
    const coordinate = alignedTick / bucketTicks;
    return ask ? stableCeil(coordinate) : stableFloor(coordinate);
};

const buildLiquidityProjection = (book: LocalOrderBook, tickSize: number): LiquidityProjection | null => {
    if (!Number.isFinite(tickSize) || tickSize <= 0) return null;
    const best = bestPrices(book);
    if (!best) return null;

    const bucketTicks = storageBucketTicks((best.bid + best.ask) / 2, tickSize);
    if (!(bucketTicks > 0)) return null;
    const askAnchor = bucketCoordinate(best.ask, tickSize, bucketTicks, true);
    const bidAnchor = bucketCoordinate(best.bid, tickSize, bucketTicks, false);
    if (!Number.isSafeInteger(askAnchor) || !Number.isSafeInteger(bidAnchor)) return null;

    const values = new Float32Array(LIQUIDITY_VALUES_PER_SAMPLE);
    const addSide = (levels: OrderBookLevel[], ask: boolean) => {
        for (const level of levels) {
            if (!validLevel(level)) continue;
            const [price, quantity] = level;
            const bucket = bucketCoordinate(price, tickSize, bucketTicks, ask);
            const slot = ask ? bucket - askAnchor : bidAnchor - bucket;
            if (!Number.isSafeInteger(slot) || slot < 0 || slot >= LIQUIDITY_BUCKETS_PER_SIDE) continue;
            const notional = price * quantity;
            if (!Number.isFinite(notional) || notional <= 0) continue;
            const index = (ask ? LIQUIDITY_BUCKETS_PER_SIDE : 0) + slot;
            const total = values[index] + notional;
            if (Number.isFinite(total) && total <= MAX_FLOAT32) values[index] = total;
        }
    };

    addSide(book.bids, false);
    addSide(book.asks, true);
    return { askAnchor, bidAnchor, bucketTicks, values };
};

const sameProjection = (sample: LiquiditySampleView, projection: LiquidityProjection): boolean => {
    if (sample.askAnchor !== projection.askAnchor || sample.bidAnchor !== projection.bidAnchor) return false;
    for (let i = 0; i < LIQUIDITY_VALUES_PER_SAMPLE; i++) {
        if (sample.values[sample.offset + i] !== projection.values[i]) return false;
    }
    return true;
};

const niceCurrencyCeil = (value: number): number => {
    if (!Number.isFinite(value) || value <= 0) return 0;
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return multiplier * magnitude;
};

export const liquidityPresetValues = (book: LocalOrderBook, tickSize: number): number[] => {
    const projection = buildLiquidityProjection(book, tickSize);
    if (!projection) return [0];
    const notionals = Array.from(projection.values).filter((value) => Number.isFinite(value) && value > 0);
    notionals.sort((a, b) => a - b);
    if (notionals.length === 0) return [0];
    const quantiles = [0.55, 0.75, 0.9].map((quantile) => {
        const index = Math.floor((notionals.length - 1) * quantile);
        return niceCurrencyCeil(notionals[index]);
    });
    return [0, ...new Set(quantiles.filter((value) => value > 0))];
};

type IntervalVisitor = (sample: LiquiditySampleView, start: number, end: number) => void;

export class LiquidityTimeline {
    private askAnchors: Float64Array | null = null;
    private bidAnchors: Float64Array | null = null;
    private bucketTicks = 0;
    private countValue = 0;
    private enabled = false;
    private everHealthy = false;
    private gapsValue: LiquidityGap[] = [];
    private generation = 0;
    private head = 0;
    private healthy = false;
    private identity = '';
    private lastAcceptedAt = -Infinity;
    private readonly onChange: () => void;
    private pending: LiquidityProjection | null = null;
    private pendingAfterGap = false;
    private pendingBook: LocalOrderBook | null = null;
    private statusValue: DepthFeedStatus = FeedStatus.Syncing;
    private tickSize = 0;
    private times: Float64Array | null = null;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private values: Float32Array | null = null;
    private versionValue = 0;

    constructor(onChange: () => void) {
        this.onChange = onChange;
    }

    get count(): number {
        return this.countValue;
    }

    get gaps(): readonly LiquidityGap[] {
        return this.gapsValue;
    }

    get sampleBucketTicks(): number {
        return this.bucketTicks;
    }

    get sampleTickSize(): number {
        return this.tickSize;
    }

    get status(): DepthFeedStatus {
        return this.statusValue;
    }

    get version(): number {
        return this.versionValue;
    }

    enable(identity: string, tickSize: number): void {
        const normalizedTick = Number.isFinite(tickSize) && tickSize > 0 ? tickSize : 0;
        if (this.enabled && identity === this.identity && normalizedTick === this.tickSize) return;
        this.release();
        this.enabled = true;
        this.identity = identity;
        this.tickSize = normalizedTick;
        this.values = new Float32Array(LIQUIDITY_HISTORY_CAPACITY * LIQUIDITY_VALUES_PER_SAMPLE);
        this.times = new Float64Array(LIQUIDITY_HISTORY_CAPACITY);
        this.askAnchors = new Float64Array(LIQUIDITY_HISTORY_CAPACITY);
        this.bidAnchors = new Float64Array(LIQUIDITY_HISTORY_CAPACITY);
        this.bump();
    }

    disable(): void {
        if (!this.enabled && !this.values) return;
        this.release();
        this.bump();
    }

    observe(state: DepthState, timestamp: number): void {
        if (!this.enabled) return;
        const t = Number.isFinite(timestamp) ? timestamp : receiptTimestamp();
        if (state.status !== FeedStatus.Healthy) {
            this.markUnavailable(state.status, t);
            return;
        }

        const best = bestPrices(state.book);
        if (!best) {
            this.markUnavailable(FeedStatus.Stale, t);
            return;
        }
        const nextBucketTicks = storageBucketTicks((best.bid + best.ask) / 2, this.tickSize);
        if (!(nextBucketTicks > 0)) {
            this.markUnavailable(FeedStatus.Stale, t);
            return;
        }

        const recovering = !this.healthy;
        if (recovering) this.closeGap(t);
        this.healthy = true;
        this.everHealthy = true;
        if (this.statusValue !== FeedStatus.Healthy) {
            this.statusValue = FeedStatus.Healthy;
            this.bump();
        }

        if (this.bucketTicks !== 0 && nextBucketTicks !== this.bucketTicks) this.resetConfiguration();

        // During the one-second cadence window, retain only the newest immutable
        // canonical book reference and project it once at the trailing edge.
        if (!recovering && this.countValue > 0 && t - this.lastAcceptedAt < LIQUIDITY_SAMPLE_INTERVAL_MS) {
            this.pending = null;
            this.pendingBook = state.book;
            this.schedule(this.lastAcceptedAt + LIQUIDITY_SAMPLE_INTERVAL_MS - t);
            return;
        }

        const projection = buildLiquidityProjection(state.book, this.tickSize);
        if (!projection) {
            this.markUnavailable(FeedStatus.Stale, t);
            return;
        }
        if (this.bucketTicks === 0) this.bucketTicks = projection.bucketTicks;

        const latest = this.countValue > 0 ? this.sample(this.countValue - 1) : null;
        if (!recovering && latest && sameProjection(latest, projection)) {
            if (this.pendingAfterGap) {
                this.pending = projection;
                this.pendingBook = null;
                return;
            }
            this.pending = null;
            this.pendingBook = null;
            this.clearTimer();
            return;
        }

        if (this.countValue === 0 || t - this.lastAcceptedAt >= LIQUIDITY_SAMPLE_INTERVAL_MS) {
            this.pending = null;
            this.pendingBook = null;
            this.pendingAfterGap = false;
            this.clearTimer();
            this.append(projection, t);
            return;
        }

        this.pending = projection;
        this.pendingBook = null;
        this.pendingAfterGap = this.pendingAfterGap || recovering;
        this.schedule(this.lastAcceptedAt + LIQUIDITY_SAMPLE_INTERVAL_MS - t);
    }

    sample(index: number): LiquiditySampleView {
        if (
            index < 0 ||
            index >= this.countValue ||
            !this.values ||
            !this.times ||
            !this.askAnchors ||
            !this.bidAnchors
        ) {
            throw new RangeError('Liquidity sample index is out of bounds');
        }
        const slot = (this.head + index) % LIQUIDITY_HISTORY_CAPACITY;
        return {
            askAnchor: this.askAnchors[slot],
            bidAnchor: this.bidAnchors[slot],
            offset: slot * LIQUIDITY_VALUES_PER_SAMPLE,
            t: this.times[slot],
            values: this.values,
        };
    }

    lowerBound(timestamp: number): number {
        let lo = 0;
        let hi = this.countValue;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (this.sample(mid).t < timestamp) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    forEachInterval(start: number, end: number, visitor: IntervalVisitor): void {
        if (this.countValue === 0 || !(end >= start)) return;
        let first = this.lowerBound(start);
        if (first > 0) first--;
        let gapIndex = 0;
        while (gapIndex < this.gapsValue.length && (this.gapsValue[gapIndex].end ?? Infinity) <= start) gapIndex++;

        for (let index = first; index < this.countValue; index++) {
            const sample = this.sample(index);
            if (sample.t > end) break;
            const nextTime = index + 1 < this.countValue ? this.sample(index + 1).t : Infinity;
            while (gapIndex < this.gapsValue.length && this.gapsValue[gapIndex].start <= sample.t) gapIndex++;
            const gapStart = this.gapsValue[gapIndex]?.start ?? Infinity;
            const intervalStart = Math.max(start, sample.t);
            const intervalEnd = Math.min(end, nextTime, gapStart);
            if (intervalEnd > intervalStart) visitor(sample, intervalStart, intervalEnd);
        }
    }

    visiblePriceExtent(start: number, end: number): { hi: number; lo: number } | null {
        if (!(this.bucketTicks > 0) || !(this.tickSize > 0)) return null;
        const bucketWidth = this.bucketTicks * this.tickSize;
        let lo = Infinity;
        let hi = -Infinity;
        this.forEachInterval(start, end, (sample) => {
            for (let slot = 0; slot < LIQUIDITY_BUCKETS_PER_SIDE; slot++) {
                if (sample.values[sample.offset + slot] > 0) {
                    const price = (sample.bidAnchor - slot) * bucketWidth;
                    lo = Math.min(lo, price);
                    hi = Math.max(hi, price + bucketWidth);
                }
                if (sample.values[sample.offset + LIQUIDITY_BUCKETS_PER_SIDE + slot] > 0) {
                    const price = (sample.askAnchor + slot) * bucketWidth;
                    lo = Math.min(lo, price - bucketWidth);
                    hi = Math.max(hi, price);
                }
            }
        });
        return Number.isFinite(lo) && Number.isFinite(hi) && hi > lo ? { hi, lo } : null;
    }

    private append(projection: LiquidityProjection, timestamp: number): void {
        if (!this.values || !this.times || !this.askAnchors || !this.bidAnchors) return;
        if (
            !Number.isFinite(timestamp) ||
            (this.countValue > 0 && timestamp - this.lastAcceptedAt < LIQUIDITY_SAMPLE_INTERVAL_MS)
        )
            return;
        const t = timestamp;
        let slot: number;
        if (this.countValue < LIQUIDITY_HISTORY_CAPACITY) {
            slot = (this.head + this.countValue) % LIQUIDITY_HISTORY_CAPACITY;
            this.countValue++;
        } else {
            slot = this.head;
            this.head = (this.head + 1) % LIQUIDITY_HISTORY_CAPACITY;
        }

        const offset = slot * LIQUIDITY_VALUES_PER_SAMPLE;
        this.values.set(projection.values, offset);
        this.askAnchors[slot] = projection.askAnchor;
        this.bidAnchors[slot] = projection.bidAnchor;
        this.times[slot] = t;
        this.lastAcceptedAt = t;
        this.trimGaps();
        this.bump();
    }

    private schedule(delay: number): void {
        if (this.timer) return;
        const generation = this.generation;
        this.timer = setTimeout(
            () => {
                this.timer = null;
                if (
                    generation !== this.generation ||
                    !this.enabled ||
                    !this.healthy ||
                    (!this.pending && !this.pendingBook)
                )
                    return;
                const now = receiptTimestamp();
                const remaining = this.lastAcceptedAt + LIQUIDITY_SAMPLE_INTERVAL_MS - now;
                if (remaining > 0) {
                    this.schedule(remaining);
                    return;
                }
                const projection = this.pending ?? buildLiquidityProjection(this.pendingBook!, this.tickSize);
                const force = this.pendingAfterGap;
                this.pending = null;
                this.pendingBook = null;
                this.pendingAfterGap = false;
                if (!projection) {
                    this.markUnavailable(FeedStatus.Stale, now);
                    return;
                }
                if (this.bucketTicks !== 0 && projection.bucketTicks !== this.bucketTicks) this.resetConfiguration();
                if (this.bucketTicks === 0) this.bucketTicks = projection.bucketTicks;
                const latest = this.countValue > 0 ? this.sample(this.countValue - 1) : null;
                if (force || !latest || !sameProjection(latest, projection)) this.append(projection, now);
            },
            Math.max(0, delay),
        );
    }

    private markUnavailable(status: DepthFeedStatus, timestamp: number): void {
        if (this.healthy && this.everHealthy && this.countValue > 0) {
            this.gapsValue = [...this.gapsValue, { end: null, start: timestamp }];
        }
        const changed = this.healthy || this.statusValue !== status;
        this.healthy = false;
        this.statusValue = status;
        this.pending = null;
        this.pendingAfterGap = false;
        this.pendingBook = null;
        this.clearTimer();
        if (changed) this.bump();
    }

    private closeGap(timestamp: number): void {
        const last = this.gapsValue[this.gapsValue.length - 1];
        if (!last || last.end !== null) return;
        this.gapsValue = [...this.gapsValue.slice(0, -1), { end: Math.max(last.start, timestamp), start: last.start }];
        this.bump();
    }

    private resetConfiguration(): void {
        this.countValue = 0;
        this.head = 0;
        this.bucketTicks = 0;
        this.gapsValue = [];
        this.lastAcceptedAt = -Infinity;
        this.pending = null;
        this.pendingAfterGap = false;
        this.pendingBook = null;
        this.clearTimer();
        this.bump();
    }

    private trimGaps(): void {
        if (this.countValue === 0) {
            this.gapsValue = [];
            return;
        }
        const oldest = this.sample(0).t;
        const firstUseful = this.gapsValue.findIndex((gap) => (gap.end ?? Infinity) >= oldest);
        if (firstUseful < 0) this.gapsValue = [];
        else if (firstUseful > 0) this.gapsValue = this.gapsValue.slice(firstUseful);
    }

    private clearTimer(): void {
        if (!this.timer) return;
        clearTimeout(this.timer);
        this.timer = null;
    }

    private release(): void {
        this.generation++;
        this.clearTimer();
        this.values = null;
        this.times = null;
        this.askAnchors = null;
        this.bidAnchors = null;
        this.pending = null;
        this.pendingAfterGap = false;
        this.pendingBook = null;
        this.gapsValue = [];
        this.countValue = 0;
        this.head = 0;
        this.bucketTicks = 0;
        this.lastAcceptedAt = -Infinity;
        this.enabled = false;
        this.healthy = false;
        this.everHealthy = false;
        this.statusValue = FeedStatus.Syncing;
        this.identity = '';
        this.tickSize = 0;
    }

    private bump(): void {
        this.versionValue++;
        this.onChange();
    }
}
