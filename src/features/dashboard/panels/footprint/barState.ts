import type { ChartBar, ChartBarsResponse } from './types';

export const MAX_LIVE_UPDATE_BARS = 500;

export const mergeContiguousBars = (...groups: ChartBar[][]): ChartBar[] => {
    const merged = new Map<number, ChartBar>();
    for (const bars of groups) {
        for (const bar of bars) merged.set(bar.barIndex, bar);
    }
    const sorted = [...merged.values()].sort((first, second) => first.barIndex - second.barIndex);
    let start = sorted.length - 1;
    while (start > 0 && sorted[start - 1].barIndex + 1 === sorted[start].barIndex) start -= 1;
    return sorted.slice(Math.max(0, start));
};

export type ChartLiveState = {
    activeBar: ChartBar | null | undefined;
    bars: ReadonlyMap<number, ChartBar>;
};

export const emptyChartLiveState = (): ChartLiveState => ({
    activeBar: undefined,
    bars: new Map(),
});

export const applyChartUpdate = (
    current: ChartLiveState,
    bars: ChartBar[],
    activeBar: ChartBar | null,
): ChartLiveState => {
    const next = new Map(current.bars);
    for (const bar of bars) next.set(bar.barIndex, bar);
    while (next.size > MAX_LIVE_UPDATE_BARS) {
        const oldest = next.keys().next().value;
        if (oldest === undefined) break;
        next.delete(oldest);
    }
    return { activeBar, bars: next };
};

export const chartUpdateHasGap = (
    snapshot: ChartBarsResponse | undefined,
    current: ChartLiveState,
    bars: ChartBar[],
    activeBar: ChartBar | null,
): boolean => {
    const snapshotMax = snapshot?.bars.at(-1)?.barIndex;
    const latestClosed = Math.max(-1, ...current.bars.keys(), ...bars.map((bar) => bar.barIndex));
    if (snapshotMax !== undefined && latestClosed - snapshotMax >= MAX_LIVE_UPDATE_BARS) return true;
    const knownClosedIndexes = [...(snapshot?.bars ?? []), ...current.bars.values()].map((bar) => bar.barIndex);
    const knownClosedMax = knownClosedIndexes.length ? Math.max(...knownClosedIndexes) : undefined;
    if (bars.length) {
        if (knownClosedMax === undefined) return false;
        const newIndexes = bars.map((bar) => bar.barIndex).filter((barIndex) => barIndex > knownClosedMax);
        return newIndexes.length > 0 && Math.min(...newIndexes) > knownClosedMax + 1;
    }
    if (!activeBar) return false;
    const previousActive = current.activeBar !== undefined ? current.activeBar : snapshot?.activeBar;
    if (previousActive) return activeBar.barIndex > previousActive.barIndex;
    return knownClosedMax !== undefined && activeBar.barIndex > knownClosedMax + 1;
};

export const mergeChartBars = (snapshot: ChartBarsResponse | undefined, live: ChartLiveState): ChartBar[] => {
    const closed = mergeContiguousBars(snapshot?.bars ?? [], [...live.bars.values()]).filter(
        (bar) => bar.barIndex >= (snapshot?.historyStartBarIndex ?? 0),
    );
    const liveProgress = Math.max(-1, ...live.bars.keys(), live.activeBar?.barIndex ?? -1);
    const snapshotProgress = Math.max(snapshot?.bars.at(-1)?.barIndex ?? -1, snapshot?.activeBar?.barIndex ?? -1);
    const snapshotHasMoreTrades =
        snapshot?.activeBar?.barIndex === live.activeBar?.barIndex &&
        (snapshot?.activeBar?.tradeCount ?? 0) > (live.activeBar?.tradeCount ?? 0);
    const activeBar =
        live.activeBar !== undefined && liveProgress >= snapshotProgress && !snapshotHasMoreTrades
            ? live.activeBar
            : snapshot?.activeBar;
    const lastClosed = closed.at(-1)?.barIndex;
    // Catch-up messages can include the active bar before intervening closed bars arrive.
    if (activeBar && (lastClosed === undefined || activeBar.barIndex === lastClosed + 1)) return [...closed, activeBar];
    return closed;
};
