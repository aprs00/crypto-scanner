import type { ChartBar, ChartBarsResponse } from './types';

export const MAX_LIVE_UPDATE_BARS = 500;

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
    const merged = new Map((snapshot?.bars ?? []).map((bar) => [bar.barIndex, bar]));
    for (const bar of live.bars.values()) merged.set(bar.barIndex, bar);
    const activeBar = live.activeBar !== undefined ? live.activeBar : snapshot?.activeBar;
    if (activeBar) merged.set(activeBar.barIndex, activeBar);
    return [...merged.values()].sort((first, second) => first.barIndex - second.barIndex);
};
