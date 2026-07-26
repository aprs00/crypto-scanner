import type { DepthCoverage, DepthSideCoverage, DepthState, NormalizedTrade } from '@/services/exchanges/types';

import { DepthFeedStatus, EMPTY_DEPTH_COVERAGE } from '@/services/exchanges/types';

import type { DomLadderRow, GroupedBook } from './domModel';
import type { LocalOrderBook, OrderBookLevel } from './types';

import { buildDomRows, groupTick, normalizeNearZero, priceToTick, pullStackDelta } from './domModel';

export type DomFeedSnapshot = {
    activityStartedAt: number;
    marketCenterTick: number | null;
    recentTrades: readonly NormalizedTrade[];
    rows: DomLadderRow[];
    status: DepthFeedStatus;
};

type ActivityStore = {
    grouped: Map<number, number>;
    values: Map<number, number>;
};

type PendingActivity = {
    depth: number;
    discard: boolean;
    execution: number;
    resetMarker: boolean;
};

type ActivityGeneration = Map<number, PendingActivity>;

type MutableDomFeed = {
    activityStartedAt: number;
    askPullStack: ActivityStore;
    askTradeBuffer: Map<number, number>;
    bidPullStack: ActivityStore;
    bidTradeBuffer: Map<number, number>;
    book: LocalOrderBook;
    buyVolume: ActivityStore;
    coverage: DepthCoverage;
    generation: number | null;
    groupTicks: number;
    groupedBook: GroupedBook;
    lastTrade: NormalizedTrade | null;
    pendingAskPullStack: ActivityGeneration[];
    pendingBidPullStack: ActivityGeneration[];
    recentTrades: NormalizedTrade[];
    seenTradeIds: Map<string, true>;
    sellVolume: ActivityStore;
    skipNextDepthComparison: boolean;
    status: DepthFeedStatus;
};

export type DomView = {
    centerTick?: number | null;
    groupTicks: number;
    includeTape: boolean;
    pullStackRowCount?: number;
    rowCount: number;
};

const EMPTY_BOOK: LocalOrderBook = { asks: [], bids: [] };
const EMPTY_GROUPED_BOOK = (): GroupedBook => ({
    asks: new Map(),
    bestAskTick: null,
    bestBidTick: null,
    bids: new Map(),
});
const EMPTY_ROWS: DomLadderRow[] = [];
const EMPTY_TRADES: readonly NormalizedTrade[] = [];
const TAPE_LIMIT = 160;
const SEEN_TRADE_LIMIT = 1_280;
const MAX_ACTIVITY_LEVELS = 4_096;
// Hold two completed depth generations so cross-stream delivery skew can be
// reconciled before a book change is classified as pulled or added liquidity.
const MAX_PENDING_GENERATIONS = 2;

const normalizedGroupTicks = (value: number): number =>
    Number.isFinite(value) ? Math.max(1, Math.min(1_000_000, Math.floor(value))) : 1;

const createActivityStore = (): ActivityStore => ({
    grouped: new Map(),
    values: new Map(),
});

const createMutableFeed = (groupTicks: number): MutableDomFeed => ({
    activityStartedAt: 0,
    askPullStack: createActivityStore(),
    askTradeBuffer: new Map(),
    bidPullStack: createActivityStore(),
    bidTradeBuffer: new Map(),
    book: EMPTY_BOOK,
    buyVolume: createActivityStore(),
    coverage: EMPTY_DEPTH_COVERAGE,
    generation: null,
    groupTicks: normalizedGroupTicks(groupTicks),
    groupedBook: EMPTY_GROUPED_BOOK(),
    lastTrade: null,
    pendingAskPullStack: [],
    pendingBidPullStack: [],
    recentTrades: [],
    seenTradeIds: new Map(),
    sellVolume: createActivityStore(),
    skipNextDepthComparison: false,
    status: DepthFeedStatus.Syncing,
});

const marketCenterTick = (book: LocalOrderBook, tickSize: number): number | null => {
    const bestBid = book.bids[0] ? priceToTick(book.bids[0][0], tickSize) : null;
    const bestAsk = book.asks[0] ? priceToTick(book.asks[0][0], tickSize) : null;
    if (bestBid !== null && bestAsk !== null) return Math.round((bestBid + bestAsk) / 2);
    return bestBid ?? bestAsk;
};

const toSnapshot = (feed: MutableDomFeed, view: DomView, tickSize: number): DomFeedSnapshot => ({
    activityStartedAt: feed.activityStartedAt,
    marketCenterTick: marketCenterTick(feed.book, tickSize),
    recentTrades: view.includeTape ? feed.recentTrades : EMPTY_TRADES,
    rows:
        feed.status === DepthFeedStatus.Healthy
            ? buildDomRows({
                  askPullStack: feed.askPullStack.grouped,
                  bidPullStack: feed.bidPullStack.grouped,
                  buyVolume: feed.buyVolume.grouped,
                  centerTick: view.centerTick,
                  coverage: feed.coverage,
                  groupedBook: feed.groupedBook,
                  groupTicks: feed.groupTicks,
                  lastTrade: feed.lastTrade,
                  pullStackRowCount: view.pullStackRowCount,
                  rowCount: view.rowCount,
                  sellVolume: feed.sellVolume.grouped,
                  tickSize,
              })
            : EMPTY_ROWS,
    status: feed.status,
});

const addGroupedValue = (grouped: Map<number, number>, tick: number, amount: number, groupTicks: number): void => {
    if (!Number.isFinite(amount) || amount === 0) return;
    const groupedTick = groupTick(tick, groupTicks);
    if (groupedTick === null) return;
    const previous = grouped.get(groupedTick) ?? 0;
    const next = normalizeNearZero(previous + amount, Math.max(Math.abs(previous), Math.abs(amount)));
    if (next === 0) grouped.delete(groupedTick);
    else grouped.set(groupedTick, next);
};

const setActivityValue = (store: ActivityStore, tick: number, value: number, groupTicks: number): void => {
    if (!Number.isSafeInteger(tick) || !Number.isFinite(value)) return;
    const previous = store.values.get(tick) ?? 0;
    const next = normalizeNearZero(value, Math.max(Math.abs(previous), Math.abs(value)));
    if (next === previous) return;

    if (next !== 0 && !store.values.has(tick) && store.values.size >= MAX_ACTIVITY_LEVELS) {
        const oldest = store.values.keys().next().value;
        if (oldest !== undefined) setActivityValue(store, oldest, 0, groupTicks);
    }

    if (next === 0) store.values.delete(tick);
    else store.values.set(tick, next);
    addGroupedValue(store.grouped, tick, next - previous, groupTicks);
};

const addActivity = (store: ActivityStore, tick: number, amount: number, groupTicks: number): void => {
    if (!Number.isSafeInteger(tick) || !Number.isFinite(amount) || amount === 0) return;
    setActivityValue(store, tick, (store.values.get(tick) ?? 0) + amount, groupTicks);
};

const addBufferedActivity = (activity: Map<number, number>, tick: number, amount: number): void => {
    if (!Number.isSafeInteger(tick) || !Number.isFinite(amount) || amount === 0) return;
    const previous = activity.get(tick) ?? 0;
    const next = normalizeNearZero(previous + amount, Math.max(Math.abs(previous), Math.abs(amount)));
    if (next === 0) {
        activity.delete(tick);
        return;
    }
    if (!activity.has(tick) && activity.size >= MAX_ACTIVITY_LEVELS) {
        const oldest = activity.keys().next().value;
        if (oldest !== undefined) activity.delete(oldest);
    }
    activity.set(tick, next);
};

const clearActivityStore = (store: ActivityStore): void => {
    store.values.clear();
    store.grouped.clear();
};

const regroupActivityStore = (store: ActivityStore, groupTicks: number): void => {
    store.grouped.clear();
    for (const [tick, value] of store.values) addGroupedValue(store.grouped, tick, value, groupTicks);
};

const addGroupedBookLevel = (
    grouped: GroupedBook,
    tick: number,
    amount: number,
    isBid: boolean,
    groupTicks: number,
): void => {
    const side = isBid ? grouped.bids : grouped.asks;
    addGroupedValue(side, tick, amount, groupTicks);
};

const rebuildGroupedBook = (feed: MutableDomFeed, tickSize: number): void => {
    const grouped = EMPTY_GROUPED_BOOK();
    for (const [price, quantity] of feed.book.bids) {
        const tick = priceToTick(price, tickSize);
        if (tick !== null && Number.isFinite(quantity) && quantity > 0) {
            addGroupedBookLevel(grouped, tick, quantity, true, feed.groupTicks);
        }
    }
    for (const [price, quantity] of feed.book.asks) {
        const tick = priceToTick(price, tickSize);
        if (tick !== null && Number.isFinite(quantity) && quantity > 0) {
            addGroupedBookLevel(grouped, tick, quantity, false, feed.groupTicks);
        }
    }
    const bestBid = feed.book.bids[0] ? priceToTick(feed.book.bids[0][0], tickSize) : null;
    const bestAsk = feed.book.asks[0] ? priceToTick(feed.book.asks[0][0], tickSize) : null;
    grouped.bestBidTick = bestBid === null ? null : groupTick(bestBid, feed.groupTicks);
    grouped.bestAskTick = bestAsk === null ? null : groupTick(bestAsk, feed.groupTicks);
    feed.groupedBook = grouped;
};

const regroupFeed = (feed: MutableDomFeed, groupTicks: number, tickSize: number): void => {
    const next = normalizedGroupTicks(groupTicks);
    if (next === feed.groupTicks) return;
    feed.groupTicks = next;
    rebuildGroupedBook(feed, tickSize);
    for (const store of [feed.askPullStack, feed.bidPullStack, feed.buyVolume, feed.sellVolume]) {
        regroupActivityStore(store, next);
    }
};

const storePendingActivity = (activity: ActivityGeneration, tick: number, next: PendingActivity): void => {
    if (next.depth === 0 && next.execution === 0 && !next.resetMarker) {
        activity.delete(tick);
        return;
    }
    if (!activity.has(tick) && activity.size >= MAX_ACTIVITY_LEVELS) {
        const oldest = activity.keys().next().value;
        if (oldest !== undefined) activity.delete(oldest);
    }
    activity.set(tick, next);
};

const addPendingDepth = (activity: ActivityGeneration, tick: number, amount: number): void => {
    if (!Number.isSafeInteger(tick) || !Number.isFinite(amount) || amount === 0) return;
    const previous = activity.get(tick);
    const depth = previous?.depth ?? 0;
    storePendingActivity(activity, tick, {
        depth: normalizeNearZero(depth + amount, Math.max(Math.abs(depth), Math.abs(amount))),
        discard: previous?.discard ?? false,
        execution: previous?.execution ?? 0,
        resetMarker: previous?.resetMarker ?? false,
    });
};

const addPendingExecution = (activity: ActivityGeneration, tick: number, amount: number): void => {
    if (!Number.isSafeInteger(tick) || !Number.isFinite(amount) || amount === 0) return;
    const previous = activity.get(tick);
    const execution = previous?.execution ?? 0;
    storePendingActivity(activity, tick, {
        depth: previous?.depth ?? 0,
        discard: previous?.discard ?? false,
        execution: normalizeNearZero(execution + amount, Math.max(Math.abs(execution), Math.abs(amount))),
        resetMarker: previous?.resetMarker ?? false,
    });
};

const matchPendingDepthReduction = (generations: ActivityGeneration[], tick: number, quantity: number): number => {
    let remainder = quantity;
    // Reset-discarded execution is consumed first so a depth update delivered
    // after the reset cannot escape as a false pull. Normal generations follow.
    for (const discardOnly of [true, false]) {
        for (let index = generations.length - 1; index >= 0 && remainder > 0; index--) {
            const generation = generations[index];
            const activity = generation.get(tick);
            if (!activity || activity.discard !== discardOnly) continue;
            const unmatchedExecution = Math.max(0, activity.execution + Math.min(0, activity.depth));
            if (unmatchedExecution === 0) continue;
            const matched = Math.min(remainder, unmatchedExecution);
            addPendingExecution(generation, tick, -matched);
            remainder = normalizeNearZero(remainder - matched, quantity);
        }
    }
    return remainder;
};

const addDepthChange = (
    generations: ActivityGeneration[],
    target: ActivityGeneration,
    tick: number,
    amount: number,
): void => {
    const inheritsReset = generations.some((generation) => generation.get(tick)?.resetMarker === true);
    if (amount >= 0) {
        addPendingDepth(target, tick, amount);
        const activity = target.get(tick);
        if (activity && inheritsReset) activity.discard = true;
        return;
    }
    const remainder = matchPendingDepthReduction(generations, tick, -amount);
    if (remainder > 0) addPendingDepth(target, tick, -remainder);
    const activity = target.get(tick);
    if (activity && inheritsReset) activity.discard = true;
};

const withinCoverage = (price: number, coverage: DepthSideCoverage, isBid: boolean): boolean => {
    if (!coverage.truncated) return true;
    if (coverage.farPrice === null) return false;
    return isBid ? price >= coverage.farPrice : price <= coverage.farPrice;
};

const processSideTransition = (
    feed: MutableDomFeed,
    previous: OrderBookLevel[],
    current: OrderBookLevel[],
    previousCoverage: DepthSideCoverage,
    currentCoverage: DepthSideCoverage,
    isBid: boolean,
    generations: ActivityGeneration[],
    target: ActivityGeneration,
    tickSize: number,
): void => {
    let previousIndex = 0;
    let currentIndex = 0;
    const reconciliationGenerations = [...generations, target];

    const apply = (price: number, previousQuantity: number, currentQuantity: number, countActivity: boolean) => {
        const tick = priceToTick(price, tickSize);
        if (tick === null) return;
        addGroupedBookLevel(feed.groupedBook, tick, currentQuantity - previousQuantity, isBid, feed.groupTicks);
        if (countActivity) {
            addDepthChange(reconciliationGenerations, target, tick, pullStackDelta(previousQuantity, currentQuantity));
        }
    };

    while (previousIndex < previous.length || currentIndex < current.length) {
        const previousLevel = previous[previousIndex];
        const currentLevel = current[currentIndex];
        if (previousLevel && currentLevel && previousLevel[0] === currentLevel[0]) {
            apply(currentLevel[0], previousLevel[1], currentLevel[1], true);
            previousIndex++;
            currentIndex++;
            continue;
        }

        const currentComesFirst =
            currentLevel &&
            (!previousLevel || (isBid ? currentLevel[0] > previousLevel[0] : currentLevel[0] < previousLevel[0]));
        if (currentComesFirst) {
            apply(currentLevel[0], 0, currentLevel[1], withinCoverage(currentLevel[0], previousCoverage, isBid));
            currentIndex++;
            continue;
        }

        if (previousLevel) {
            apply(previousLevel[0], previousLevel[1], 0, withinCoverage(previousLevel[0], currentCoverage, isBid));
            previousIndex++;
        }
    }
};

const generationFromTradeBuffer = (buffer: Map<number, number>): ActivityGeneration => {
    const generation: ActivityGeneration = new Map();
    for (const [tick, quantity] of buffer) addPendingExecution(generation, tick, quantity);
    buffer.clear();
    return generation;
};

const discardGenerationTicks = (generations: ActivityGeneration[], ticks: (number | null)[]): void => {
    for (const generation of generations) {
        for (const tick of ticks) {
            if (tick === null) continue;
            const activity = generation.get(tick);
            if (activity) activity.discard = true;
        }
    }
};

const flushOldestGeneration = (
    generations: ActivityGeneration[],
    displayed: ActivityStore,
    groupTicks: number,
): void => {
    if (generations.length < MAX_PENDING_GENERATIONS) return;
    const generation = generations.shift();
    if (!generation) return;
    for (const [tick, activity] of generation) {
        if (activity.discard) continue;
        const net = normalizeNearZero(
            activity.depth + activity.execution,
            Math.max(Math.abs(activity.depth), Math.abs(activity.execution)),
        );
        addActivity(displayed, tick, net, groupTicks);
    }
};

const matchPendingExecution = (
    generations: ActivityGeneration[],
    tick: number,
    quantity: number,
    absorbReset: boolean,
): number => {
    let remainder = quantity;
    for (let index = generations.length - 1; index >= 0 && remainder > 0; index--) {
        const generation = generations[index];
        const activity = generation.get(tick);
        if (!activity || (absorbReset ? !activity.discard : activity.discard)) continue;
        const net = normalizeNearZero(
            activity.depth + activity.execution,
            Math.max(Math.abs(activity.depth), Math.abs(activity.execution)),
        );
        if (net >= 0) continue;
        const matched = Math.min(remainder, -net);
        addPendingExecution(generation, tick, matched);
        remainder = normalizeNearZero(remainder - matched, quantity);
    }
    return absorbReset ? 0 : remainder;
};

const resetTicks = (previous: number | null, current: number | null): (number | null)[] =>
    previous === current ? [] : [previous, current];

const applyInsideReset = (
    generations: ActivityGeneration[],
    generation: ActivityGeneration,
    displayed: ActivityStore,
    previousBest: number | null,
    currentBest: number | null,
    groupTicks: number,
): void => {
    const ticks = resetTicks(previousBest, currentBest);
    if (ticks.length === 0) return;
    for (const tick of ticks) {
        if (tick !== null) setActivityValue(displayed, tick, 0, groupTicks);
    }
    discardGenerationTicks(generations, ticks);
    for (const tick of ticks) {
        if (tick === null) continue;
        const activity = generation.get(tick);
        if (activity) {
            activity.discard = true;
        } else {
            generation.set(tick, { depth: 0, discard: true, execution: 0, resetMarker: true });
        }
        const marked = generation.get(tick);
        if (marked) marked.resetMarker = true;
    }
};

const sideHasTick = (levels: OrderBookLevel[], tick: number, tickSize: number, isBid: boolean): boolean => {
    let low = 0;
    let high = levels.length - 1;
    while (low <= high) {
        const middle = (low + high) >> 1;
        const middleTick = priceToTick(levels[middle][0], tickSize);
        if (middleTick === null) return false;
        if (middleTick === tick) return true;
        const comesBefore = isBid ? middleTick > tick : middleTick < tick;
        if (comesBefore) low = middle + 1;
        else high = middle - 1;
    }
    return false;
};

const reconcileTrade = (
    levels: OrderBookLevel[],
    isBid: boolean,
    generations: ActivityGeneration[],
    tradeBuffer: Map<number, number>,
    tick: number,
    quantity: number,
    tickSize: number,
): void => {
    const absorbReset = generations.some((generation) => generation.get(tick)?.resetMarker === true);
    const remainder = matchPendingExecution(generations, tick, quantity, absorbReset);
    if (remainder > 0 && sideHasTick(levels, tick, tickSize, isBid)) {
        addBufferedActivity(tradeBuffer, tick, remainder);
    }
};

const bookWindow = (feed: MutableDomFeed, tickSize: number): { high: number; low: number } | null => {
    const bidFar =
        feed.coverage.bids.farPrice ??
        (feed.book.bids.length > 0 ? feed.book.bids[feed.book.bids.length - 1][0] : null);
    const askFar =
        feed.coverage.asks.farPrice ??
        (feed.book.asks.length > 0 ? feed.book.asks[feed.book.asks.length - 1][0] : null);
    const low = bidFar === null ? null : priceToTick(bidFar, tickSize);
    const high = askFar === null ? null : priceToTick(askFar, tickSize);
    return low === null || high === null || high < low ? null : { high, low };
};

const pruneMapToWindow = <T>(activity: Map<number, T>, window: { high: number; low: number } | null): void => {
    if (!window) {
        activity.clear();
        return;
    }
    for (const tick of activity.keys()) {
        if (tick < window.low || tick > window.high) activity.delete(tick);
    }
};

const pruneStoreToWindow = (
    store: ActivityStore,
    window: { high: number; low: number } | null,
    groupTicks: number,
): void => {
    if (!window) {
        clearActivityStore(store);
        return;
    }
    for (const tick of store.values.keys()) {
        if (tick < window.low || tick > window.high) setActivityValue(store, tick, 0, groupTicks);
    }
};

const pruneFeedToBookWindow = (feed: MutableDomFeed, tickSize: number): void => {
    const window = bookWindow(feed, tickSize);
    for (const store of [feed.bidPullStack, feed.askPullStack, feed.buyVolume, feed.sellVolume]) {
        pruneStoreToWindow(store, window, feed.groupTicks);
    }
    for (const map of [feed.bidTradeBuffer, feed.askTradeBuffer]) pruneMapToWindow(map, window);
    for (const generation of feed.pendingBidPullStack) pruneMapToWindow(generation, window);
    for (const generation of feed.pendingAskPullStack) pruneMapToWindow(generation, window);
};

const resetReconciliation = (feed: MutableDomFeed): void => {
    feed.askTradeBuffer.clear();
    feed.bidTradeBuffer.clear();
    feed.pendingAskPullStack.length = 0;
    feed.pendingBidPullStack.length = 0;
};

const resetDisplayedActivity = (feed: MutableDomFeed): void => {
    for (const store of [feed.askPullStack, feed.bidPullStack, feed.buyVolume, feed.sellVolume]) {
        clearActivityStore(store);
    }
    resetReconciliation(feed);
};

const rememberTrade = (feed: MutableDomFeed, trade: NormalizedTrade, seenLimit: number): boolean => {
    const key = `${typeof trade.id}:${String(trade.id)}`;
    if (feed.seenTradeIds.has(key)) return false;
    feed.seenTradeIds.set(key, true);
    if (feed.seenTradeIds.size > seenLimit) {
        const expired = feed.seenTradeIds.keys().next().value;
        if (expired !== undefined) feed.seenTradeIds.delete(expired);
    }
    return true;
};

const baselineBook = (
    feed: MutableDomFeed,
    state: {
        book: LocalOrderBook;
        coverage: DepthCoverage;
        generation: number;
    },
    tickSize: number,
): void => {
    feed.book = state.book;
    feed.coverage = state.coverage;
    feed.generation = state.generation;
    feed.skipNextDepthComparison = false;
    resetReconciliation(feed);
    rebuildGroupedBook(feed, tickSize);
    pruneFeedToBookWindow(feed, tickSize);
    if (feed.activityStartedAt === 0) feed.activityStartedAt = Date.now();
};

export const EMPTY_DOM_FEED_SNAPSHOT: DomFeedSnapshot = {
    activityStartedAt: 0,
    marketCenterTick: null,
    recentTrades: EMPTY_TRADES,
    rows: EMPTY_ROWS,
    status: DepthFeedStatus.Syncing,
};

export default class DomFeedEngine {
    private readonly feed: MutableDomFeed;
    private readonly tickSize: number;
    private tapeCollectionEnabled = true;

    constructor(groupTicks: number, tickSize: number) {
        this.feed = createMutableFeed(groupTicks);
        this.tickSize = tickSize;
    }

    snapshot(view: DomView): DomFeedSnapshot {
        return toSnapshot(this.feed, view, this.tickSize);
    }

    regroup(groupTicks: number): void {
        regroupFeed(this.feed, groupTicks, this.tickSize);
    }

    setTapeCollectionEnabled(enabled: boolean): void {
        if (enabled === this.tapeCollectionEnabled) return;
        this.tapeCollectionEnabled = enabled;
        if (!enabled) this.feed.recentTrades = [];
    }

    acceptDepth(state: DepthState): void {
        const feed = this.feed;
        const previousStatus = feed.status;
        feed.status = state.status;
        if (state.status !== DepthFeedStatus.Healthy) {
            feed.book = EMPTY_BOOK;
            feed.coverage = state.coverage;
            feed.groupedBook = EMPTY_GROUPED_BOOK();
            // A resynchronization invalidates only the unresolved
            // depth/trade matching window. Executions, tape, and already
            // classified pull/stack values are historical observations and
            // remain valid across a temporary acquisition gap.
            if (previousStatus === DepthFeedStatus.Healthy || feed.generation !== null) {
                resetReconciliation(feed);
                feed.skipNextDepthComparison = false;
            }
            return;
        }

        if (
            previousStatus !== DepthFeedStatus.Healthy ||
            feed.generation === null ||
            feed.generation !== state.generation ||
            feed.skipNextDepthComparison
        ) {
            baselineBook(feed, state, this.tickSize);
            return;
        }

        const previousBook = feed.book;
        const previousCoverage = feed.coverage;
        const previousBestBid = previousBook.bids[0] ? priceToTick(previousBook.bids[0][0], this.tickSize) : null;
        const previousBestAsk = previousBook.asks[0] ? priceToTick(previousBook.asks[0][0], this.tickSize) : null;
        const currentBestBid = state.book.bids[0] ? priceToTick(state.book.bids[0][0], this.tickSize) : null;
        const currentBestAsk = state.book.asks[0] ? priceToTick(state.book.asks[0][0], this.tickSize) : null;

        const bidGeneration = generationFromTradeBuffer(feed.bidTradeBuffer);
        processSideTransition(
            feed,
            previousBook.bids,
            state.book.bids,
            previousCoverage.bids,
            state.coverage.bids,
            true,
            feed.pendingBidPullStack,
            bidGeneration,
            this.tickSize,
        );
        const askGeneration = generationFromTradeBuffer(feed.askTradeBuffer);
        processSideTransition(
            feed,
            previousBook.asks,
            state.book.asks,
            previousCoverage.asks,
            state.coverage.asks,
            false,
            feed.pendingAskPullStack,
            askGeneration,
            this.tickSize,
        );

        feed.groupedBook.bestBidTick = currentBestBid === null ? null : groupTick(currentBestBid, feed.groupTicks);
        feed.groupedBook.bestAskTick = currentBestAsk === null ? null : groupTick(currentBestAsk, feed.groupTicks);
        applyInsideReset(
            feed.pendingBidPullStack,
            bidGeneration,
            feed.bidPullStack,
            previousBestBid,
            currentBestBid,
            feed.groupTicks,
        );
        applyInsideReset(
            feed.pendingAskPullStack,
            askGeneration,
            feed.askPullStack,
            previousBestAsk,
            currentBestAsk,
            feed.groupTicks,
        );

        flushOldestGeneration(feed.pendingBidPullStack, feed.bidPullStack, feed.groupTicks);
        flushOldestGeneration(feed.pendingAskPullStack, feed.askPullStack, feed.groupTicks);
        feed.pendingBidPullStack.push(bidGeneration);
        feed.pendingAskPullStack.push(askGeneration);

        feed.book = state.book;
        feed.coverage = state.coverage;
        feed.generation = state.generation;
        pruneFeedToBookWindow(feed, this.tickSize);
    }

    acceptTrade(trade: NormalizedTrade): boolean {
        const feed = this.feed;
        if (
            !Number.isFinite(trade.price) ||
            !Number.isFinite(trade.size) ||
            !Number.isFinite(trade.time) ||
            trade.price <= 0 ||
            trade.size <= 0 ||
            !rememberTrade(feed, trade, SEEN_TRADE_LIMIT)
        ) {
            return false;
        }

        if (this.tapeCollectionEnabled) {
            const recentTrades = [trade, ...feed.recentTrades];
            if (recentTrades.length > TAPE_LIMIT) recentTrades.length = TAPE_LIMIT;
            feed.recentTrades = recentTrades;
        }
        feed.lastTrade = trade;
        if (feed.activityStartedAt === 0) return true;

        const tick = priceToTick(trade.price, this.tickSize);
        if (tick === null) return true;

        const hitsBid = trade.isBuyerMaker;
        addActivity(hitsBid ? feed.sellVolume : feed.buyVolume, tick, trade.size, feed.groupTicks);
        if (feed.status === DepthFeedStatus.Healthy) {
            reconcileTrade(
                hitsBid ? feed.book.bids : feed.book.asks,
                hitsBid,
                hitsBid ? feed.pendingBidPullStack : feed.pendingAskPullStack,
                hitsBid ? feed.bidTradeBuffer : feed.askTradeBuffer,
                tick,
                trade.size,
                this.tickSize,
            );
        }
        return true;
    }

    clearActivity(): void {
        const feed = this.feed;
        resetDisplayedActivity(feed);
        // Suppress one comparison so an execution received immediately before
        // Clear cannot emerge as an unmatched depth reduction afterward.
        feed.skipNextDepthComparison = feed.status === DepthFeedStatus.Healthy;
        feed.activityStartedAt = feed.status === DepthFeedStatus.Healthy ? Date.now() : 0;
    }
}
