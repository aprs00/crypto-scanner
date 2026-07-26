import type { LocalOrderBook, OrderBookLevel } from '../types';

export type BookDiffSequence = { from: number; previous: number; to: number };

export interface BookSyncerConfig<TDiff, TSnap> {
    fetchSnapshot: () => Promise<TSnap>;
    snapSequence: (s: TSnap) => number;
    diffSequence: (d: TDiff) => BookDiffSequence;
    isStaleSequence: (sequence: BookDiffSequence, snapshotSequence: number) => boolean;
    bridgesSnapshot: (sequence: BookDiffSequence, snapshotSequence: number) => boolean;
    continuesSequence: (sequence: BookDiffSequence, previousSequence: number) => boolean;
    loadSnapshot: (s: TSnap, bids: Map<number, number>, asks: Map<number, number>) => boolean;
    applyDiff: (d: TDiff, bids: Map<number, number>, asks: Map<number, number>) => boolean;
    // Called after every applied event. It may enforce exchange-specific
    // retention invariants by mutating the Maps, but it must never invent levels.
    normalizeBook?: (bids: Map<number, number>, asks: Map<number, number>) => boolean;
    needsRefresh?: (bids: ReadonlyMap<number, number>, asks: ReadonlyMap<number, number>) => boolean;
    diffWeight?: (d: TDiff) => number;
    onChange: (book: LocalOrderBook) => void;
    // Fires once whenever a healthy acquisition becomes untrustworthy or starts
    // a proactive coverage refresh. The socket remains subscribed while a new
    // snapshot handshake is performed.
    onInvalid?: () => void;
    maxBufferedDiffs?: number;
    maxBufferedWeight?: number;
    retryBaseMs?: number;
    retryMaxMs?: number;
}

const DEFAULT_MAX_BUFFERED_DIFFS = 256;
const DEFAULT_MAX_BUFFERED_WEIGHT = 20_000;
const DEFAULT_RETRY_BASE_MS = 1_000;
const DEFAULT_RETRY_MAX_MS = 30_000;

// Snapshot+diff state machine. Recovery deliberately keeps the WebSocket
// subscription alive: incoming events remain buffered while a fresh REST
// snapshot is fetched, avoiding the blind interval created by unsubscribe /
// subscribe recovery.
class BookSyncer<TDiff, TSnap> {
    private readonly cfg: BookSyncerConfig<TDiff, TSnap>;
    private readonly bids = new Map<number, number>();
    private readonly asks = new Map<number, number>();
    private lastUpdateId = 0;

    private buffer: TDiff[] = [];
    private bufferWeight = 0;
    private snapshot: TSnap | null = null;
    private connected = false;
    private synced = false;
    private snapshotPending = false;
    // Bumped whenever a socket generation or synchronization attempt is
    // superseded so late REST responses cannot mutate the current state.
    private generation = 0;
    private snapshotRetryTimer: ReturnType<typeof setTimeout> | null = null;
    private retryAttempt = 0;

    constructor(cfg: BookSyncerConfig<TDiff, TSnap>) {
        this.cfg = cfg;
    }

    onConnect(): void {
        this.connected = true;
        this.startAttempt();
    }

    onDisconnect(): void {
        this.connected = false;
        this.generation++;
        this.clearSnapshotRetry();
        this.resetWorkingState();
    }

    onDiff(diff: TDiff): void {
        const sequence = this.cfg.diffSequence(diff);
        if (!this.isValidSequence(sequence)) {
            if (this.synced) this.restartSync();
            return;
        }

        if (this.synced) {
            this.applyLive(diff, sequence);
            return;
        }

        this.pushBuffered(diff);
        if (this.snapshot) this.syncFromSnapshot(this.generation);
    }

    private startAttempt(seeds: readonly TDiff[] = []): void {
        this.generation++;
        this.clearSnapshotRetry();
        this.resetWorkingState();
        this.retryAttempt = 0;
        for (const seed of seeds) this.pushBuffered(seed);
        if (this.connected) void this.fetchSnapshot(this.generation);
    }

    private restartSync(seeds: readonly TDiff[] = []): void {
        const wasSynced = this.synced;
        this.startAttempt(seeds);
        if (wasSynced) this.cfg.onInvalid?.();
    }

    private resetWorkingState(): void {
        this.buffer = [];
        this.bufferWeight = 0;
        this.snapshot = null;
        this.synced = false;
        this.snapshotPending = false;
        this.bids.clear();
        this.asks.clear();
        this.lastUpdateId = 0;
    }

    private async fetchSnapshot(generation: number): Promise<void> {
        if (!this.connected || generation !== this.generation || this.snapshotPending) return;
        this.snapshotPending = true;
        let snapshot: TSnap;
        try {
            snapshot = await this.cfg.fetchSnapshot();
        } catch {
            if (generation === this.generation && this.connected) {
                this.snapshotPending = false;
                this.scheduleSnapshotRetry(generation);
            }
            return;
        }
        if (generation !== this.generation || !this.connected) return;
        this.snapshotPending = false;
        this.snapshot = snapshot;
        this.syncFromSnapshot(generation);
    }

    private syncFromSnapshot(generation: number): void {
        const snapshot = this.snapshot;
        if (!snapshot || generation !== this.generation) return;
        const snapSeq = this.cfg.snapSequence(snapshot);
        if (!Number.isSafeInteger(snapSeq) || snapSeq < 0) {
            this.rejectSnapshot(generation);
            return;
        }

        const events = this.buffer.filter((event) => !this.cfg.isStaleSequence(this.cfg.diffSequence(event), snapSeq));
        this.replaceBuffer(events);
        if (events.length === 0) return;

        const firstSequence = this.cfg.diffSequence(events[0]);
        if (!this.cfg.bridgesSnapshot(firstSequence, snapSeq)) {
            // The retained suffix starts after this snapshot. A newer snapshot
            // may bridge it; until then we remain explicitly unsynchronized.
            this.rejectSnapshot(generation);
            return;
        }

        this.bids.clear();
        this.asks.clear();
        if (!this.cfg.loadSnapshot(snapshot, this.bids, this.asks)) {
            this.rejectSnapshot(generation);
            return;
        }

        this.lastUpdateId = snapSeq;
        for (const [index, event] of events.entries()) {
            const sequence = this.cfg.diffSequence(event);
            if ((index === 0 && sequence.to < this.lastUpdateId) || (index > 0 && sequence.to <= this.lastUpdateId)) {
                continue;
            }
            if (
                index > 0 &&
                sequence.to > this.lastUpdateId &&
                !this.cfg.continuesSequence(sequence, this.lastUpdateId)
            ) {
                // The gap event and every later event may bridge a newer
                // snapshot. Preserve the complete suffix across the restart.
                this.restartSync(events.slice(index));
                return;
            }
            if (!this.applyDiffEvent(event)) {
                this.restartSync();
                return;
            }
        }

        const book = this.buildBook();
        if (!book) {
            this.restartSync();
            return;
        }

        this.buffer = [];
        this.bufferWeight = 0;
        this.snapshot = null;
        this.synced = true;
        this.retryAttempt = 0;
        this.clearSnapshotRetry();
        this.cfg.onChange(book);
        this.refreshIfNeeded();
    }

    private applyLive(diff: TDiff, sequence: BookDiffSequence): void {
        if (sequence.to <= this.lastUpdateId) return;
        if (!this.cfg.continuesSequence(sequence, this.lastUpdateId)) {
            // The gap-causing event is retained as a possible bridge for the
            // replacement snapshot.
            this.restartSync([diff]);
            return;
        }
        if (!this.applyDiffEvent(diff)) {
            this.restartSync();
            return;
        }
        const book = this.buildBook();
        if (!book) {
            this.restartSync();
            return;
        }
        this.cfg.onChange(book);
        this.refreshIfNeeded();
    }

    private applyDiffEvent(diff: TDiff): boolean {
        if (!this.cfg.applyDiff(diff, this.bids, this.asks)) return false;
        if (this.cfg.normalizeBook && !this.cfg.normalizeBook(this.bids, this.asks)) return false;
        this.lastUpdateId = this.cfg.diffSequence(diff).to;
        return true;
    }

    private buildBook(): LocalOrderBook | null {
        return materializeOrderBook(this.bids, this.asks);
    }

    private refreshIfNeeded(): void {
        if (!this.synced || !this.cfg.needsRefresh?.(this.bids, this.asks)) return;
        this.restartSync();
    }

    private rejectSnapshot(generation: number): void {
        this.snapshot = null;
        this.bids.clear();
        this.asks.clear();
        this.lastUpdateId = 0;
        this.scheduleSnapshotRetry(generation);
    }

    private pushBuffered(diff: TDiff): void {
        const weight = this.diffWeight(diff);
        this.buffer.push(diff);
        this.bufferWeight += weight;

        const maxDiffs = Math.max(1, this.cfg.maxBufferedDiffs ?? DEFAULT_MAX_BUFFERED_DIFFS);
        const maxWeight = Math.max(1, this.cfg.maxBufferedWeight ?? DEFAULT_MAX_BUFFERED_WEIGHT);
        while (this.buffer.length > maxDiffs || this.bufferWeight > maxWeight) {
            const dropped = this.buffer.shift();
            if (dropped === undefined) break;
            this.bufferWeight -= this.diffWeight(dropped);
        }
        this.bufferWeight = Math.max(0, this.bufferWeight);
    }

    private replaceBuffer(events: TDiff[]): void {
        this.buffer = events;
        this.bufferWeight = events.reduce((total, event) => total + this.diffWeight(event), 0);
    }

    private diffWeight(diff: TDiff): number {
        const value = this.cfg.diffWeight?.(diff) ?? 1;
        return Number.isSafeInteger(value) && value > 0 ? value : 1;
    }

    private isValidSequence({ from, previous, to }: BookDiffSequence): boolean {
        return (
            Number.isSafeInteger(from) &&
            Number.isSafeInteger(to) &&
            from >= 0 &&
            from <= to &&
            Number.isSafeInteger(previous) &&
            previous >= 0
        );
    }

    private scheduleSnapshotRetry(generation: number): void {
        if (this.snapshotRetryTimer || !this.connected || generation !== this.generation) return;
        const base = Math.max(100, this.cfg.retryBaseMs ?? DEFAULT_RETRY_BASE_MS);
        const ceiling = Math.max(base, this.cfg.retryMaxMs ?? DEFAULT_RETRY_MAX_MS);
        const exponential = Math.min(ceiling, base * 2 ** Math.min(this.retryAttempt, 8));
        this.retryAttempt++;
        const delay = Math.round(exponential * (0.8 + Math.random() * 0.4));
        this.snapshotRetryTimer = setTimeout(() => {
            this.snapshotRetryTimer = null;
            if (generation === this.generation && this.connected) void this.fetchSnapshot(generation);
        }, delay);
    }

    private clearSnapshotRetry(): void {
        if (this.snapshotRetryTimer) clearTimeout(this.snapshotRetryTimer);
        this.snapshotRetryTimer = null;
    }
}

const numericField = (value: unknown): number | null => {
    if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

// Parse absolute quantity updates as one validated unit. A malformed tuple must
// not be silently skipped while the local book continues claiming to be healthy.
// If a venue repeats a price in one batch, the last absolute value wins.
export const parseLevelDeltas = (levels: unknown): OrderBookLevel[] | null => {
    if (!Array.isArray(levels)) return null;
    const parsed = new Map<number, number>();
    for (const tuple of levels) {
        if (!Array.isArray(tuple) || tuple.length !== 2) return null;
        const price = numericField(tuple[0]);
        const quantity = numericField(tuple[1]);
        if (price === null || quantity === null || price <= 0 || quantity < 0) return null;
        parsed.set(price, quantity);
    }
    return [...parsed];
};

export const applyParsedLevelDeltas = (
    side: Map<number, number>,
    levels: readonly OrderBookLevel[],
    accepts: (price: number) => boolean = () => true,
): void => {
    for (const [price, quantity] of levels) {
        if (!accepts(price)) continue;
        if (quantity === 0) side.delete(price);
        else side.set(price, quantity);
    }
};

export const materializeOrderBook = (
    bids: ReadonlyMap<number, number>,
    asks: ReadonlyMap<number, number>,
): LocalOrderBook | null => {
    const sortedAsks = [...asks].sort((a, b) => a[0] - b[0]);
    const sortedBids = [...bids].sort((a, b) => b[0] - a[0]);
    if (!sortedAsks.length || !sortedBids.length || sortedAsks[0][0] <= sortedBids[0][0]) return null;
    return { asks: sortedAsks, bids: sortedBids };
};

export default BookSyncer;
