import type { LocalOrderBook } from '@/routes/~chart/types';

export interface BookSyncerConfig<TDiff, TSnap> {
    fetchSnapshot: () => Promise<TSnap>;
    snapSequence: (s: TSnap) => number;
    // Per-diff sequence window: a diff covers updates [from..to].
    // Consecutive diffs must satisfy `next.from <= current + 1 <= next.to`.
    diffSequence: (d: TDiff) => { from: number; to: number };
    loadSnapshot: (s: TSnap, bids: Map<number, number>, asks: Map<number, number>) => void;
    applyDiff: (d: TDiff, bids: Map<number, number>, asks: Map<number, number>) => void;
    onChange: (book: LocalOrderBook) => void;
    // Fires when the caller must drop the upstream WS subscription and restart
    // (the only way to recover from a sequence gap on a multiplexed feed).
    onGap: () => void;
    // Fires immediately when published state is no longer trustworthy. Recovery
    // may remain delayed to avoid a retry storm, but consumers stop holding data.
    onInvalid?: () => void;
    resyncDelayMs?: number;
}

const DEFAULT_RESYNC_DELAY_MS = 1_000;

// Pure state machine for snapshot+diff order books: the caller pumps diffs via
// onDiff() and lifecycle via onConnect()/onDisconnect(); we emit via onChange,
// and call onGap() when recovery needs the upstream subscription dropped.
class BookSyncer<TDiff, TSnap> {
    private readonly cfg: BookSyncerConfig<TDiff, TSnap>;
    private readonly bids = new Map<number, number>();
    private readonly asks = new Map<number, number>();
    private lastUpdateId = 0;

    private buffer: TDiff[] = [];
    private synced = false;
    private snapshotPending = false;
    // Bumped on every onConnect() so messages from a stale socket and the
    // resolved snapshot fetch from a previous generation are ignored.
    private generation = 0;
    private resyncScheduled = false;
    private resyncTimer: ReturnType<typeof setTimeout> | null = null;
    private snapshotRetryTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(cfg: BookSyncerConfig<TDiff, TSnap>) {
        this.cfg = cfg;
    }

    onConnect(): void {
        this.clearResync();
        this.clearSnapshotRetry();
        this.generation++;
        this.buffer = [];
        this.synced = false;
        this.snapshotPending = false;
        this.bids.clear();
        this.asks.clear();
        this.lastUpdateId = 0;
    }

    onDisconnect(): void {
        this.clearResync();
        this.clearSnapshotRetry();
        // Invalidate any in-flight snapshot fetch and incoming messages.
        this.generation++;
        this.buffer = [];
        this.synced = false;
        this.snapshotPending = false;
    }

    onDiff(diff: TDiff): void {
        if (!this.snapshotPending && !this.synced) {
            this.snapshotPending = true;
            this.buffer.push(diff);
            void this.fetchSnapshot(this.generation);
        } else if (!this.synced) {
            this.buffer.push(diff);
        } else {
            this.applyLive(diff);
        }
    }

    private async fetchSnapshot(generation: number): Promise<void> {
        let snapshot: TSnap;
        try {
            snapshot = await this.cfg.fetchSnapshot();
        } catch {
            if (generation === this.generation) this.scheduleGap();
            return;
        }
        if (generation !== this.generation) return; // superseded
        this.syncFromSnapshot(snapshot, generation);
    }

    private syncFromSnapshot(snapshot: TSnap, generation: number): void {
        const snapSeq = this.cfg.snapSequence(snapshot);
        if (!Number.isSafeInteger(snapSeq) || snapSeq < 0) {
            this.failSync();
            return;
        }
        // Keep only buffered diffs that include updates newer than the snapshot.
        const events = this.buffer.filter((event) => this.cfg.diffSequence(event).to > snapSeq);

        // The first kept diff must bridge the snapshot
        // (from <= snapSeq + 1 <= to). If it starts after that, the snapshot
        // predates our buffer — refetch a fresher one.
        if (events.length > 0 && this.cfg.diffSequence(events[0]).from > snapSeq + 1) {
            this.clearSnapshotRetry();
            this.snapshotRetryTimer = setTimeout(() => {
                this.snapshotRetryTimer = null;
                if (generation === this.generation) void this.fetchSnapshot(generation);
            }, this.cfg.resyncDelayMs ?? DEFAULT_RESYNC_DELAY_MS);
            return;
        }

        this.cfg.loadSnapshot(snapshot, this.bids, this.asks);
        this.lastUpdateId = snapSeq;
        for (const event of events) {
            const { from, to } = this.cfg.diffSequence(event);
            if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from > to) {
                this.failSync();
                return;
            }
            if (to <= this.lastUpdateId) continue;
            if (from > this.lastUpdateId + 1 || to < this.lastUpdateId + 1) {
                this.failSync();
                return;
            }
            this.applyDiffEvent(event);
        }

        this.buffer = [];
        this.synced = true;
        this.emit();
    }

    private applyLive(diff: TDiff): void {
        const { from, to } = this.cfg.diffSequence(diff);
        if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from > to) {
            this.failSync();
            return;
        }
        if (to <= this.lastUpdateId) return; // already covered
        if (from > this.lastUpdateId + 1 || to < this.lastUpdateId + 1) {
            // Sequence gap — a diff was missed and applying out-of-order data
            // makes top-of-book jump. Discard and ask the caller to resync.
            this.failSync();
            return;
        }
        this.applyDiffEvent(diff);
        this.emit();
    }

    private applyDiffEvent(diff: TDiff): void {
        this.cfg.applyDiff(diff, this.bids, this.asks);
        this.lastUpdateId = this.cfg.diffSequence(diff).to;
    }

    private emit(): void {
        const asks = [...this.asks].sort((a, b) => a[0] - b[0]);
        const bids = [...this.bids].sort((a, b) => b[0] - a[0]);
        if (!asks.length || !bids.length || asks[0][0] <= bids[0][0]) {
            this.failSync();
            return;
        }
        const book: LocalOrderBook = {
            asks,
            bids,
        };
        this.cfg.onChange(book);
    }

    private scheduleGap(): void {
        if (this.resyncScheduled) return; // collapse bursts of gaps into one
        this.resyncScheduled = true;
        this.cfg.onInvalid?.();
        this.resyncTimer = setTimeout(() => {
            this.resyncTimer = null;
            this.resyncScheduled = false;
            this.cfg.onGap();
        }, this.cfg.resyncDelayMs ?? DEFAULT_RESYNC_DELAY_MS);
    }

    private failSync(): void {
        if (!this.synced && this.resyncScheduled) return;
        this.synced = false;
        this.snapshotPending = true;
        this.buffer = [];
        this.scheduleGap();
    }

    private clearResync(): void {
        if (this.resyncTimer) clearTimeout(this.resyncTimer);
        this.resyncTimer = null;
        this.resyncScheduled = false;
    }

    private clearSnapshotRetry(): void {
        if (this.snapshotRetryTimer) clearTimeout(this.snapshotRetryTimer);
        this.snapshotRetryTimer = null;
    }
}

export const applyLevelDeltas = (side: Map<number, number>, levels: [string, string][]): void => {
    for (const [priceStr, qtyStr] of levels) {
        const price = +priceStr;
        const qty = +qtyStr;
        if (!Number.isFinite(price) || !Number.isFinite(qty) || price <= 0 || qty < 0) continue;
        if (qty === 0) side.delete(price);
        else side.set(price, qty);
    }
};

export default BookSyncer;
