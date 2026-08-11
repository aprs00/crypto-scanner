import { describe, expect, it } from 'vitest';

import type { ChartBar, ChartBarsResponse } from './types';

import {
    applyChartUpdate,
    chartUpdateHasGap,
    emptyChartLiveState,
    MAX_VISIBLE_CHART_BARS,
    mergeChartBars,
} from './barState';

const makeBar = (barIndex: number, buyUnits = barIndex): ChartBar => ({
    barIndex,
    breakBefore: false,
    buyUnits,
    closeTick: 101,
    highTick: 102,
    levels: [[100, buyUnits, 2]],
    lowTick: 99,
    openedAtMs: 1_800_000_000_000 + barIndex,
    openTick: 100,
    quantityStep: '1',
    sellUnits: 2,
    tickSize: '0.5',
    tradeCount: 4,
});

const snapshot = (bars: ChartBar[], activeBar: ChartBar | null = null): ChartBarsResponse => ({
    activeBar,
    bars,
    seriesKey: 'series-1',
});

describe('chart live state', () => {
    it('merges snapshot bars, absolute live replacements, and the current active bar', () => {
        const live = applyChartUpdate(emptyChartLiveState(), [makeBar(31, 20)], makeBar(32, 30));

        const merged = mergeChartBars(snapshot([makeBar(30), makeBar(31, 1)]), live);

        expect(merged.map((bar) => bar.barIndex)).toEqual([30, 31, 32]);
        expect(merged.find((bar) => bar.barIndex === 31)?.buyUnits).toBe(20);
        expect(merged.find((bar) => bar.barIndex === 32)?.buyUnits).toBe(30);
    });

    it('uses an explicit null live active bar instead of a stale snapshot active bar', () => {
        const live = applyChartUpdate(emptyChartLiveState(), [makeBar(41)], null);

        expect(mergeChartBars(snapshot([makeBar(40)], makeBar(41, 1)), live)).toEqual([makeBar(40), makeBar(41)]);
    });

    it('reconciles a refreshed reconnect snapshot with newer absolute live data', () => {
        const live = applyChartUpdate(emptyChartLiveState(), [makeBar(51, 50)], makeBar(52));
        const refreshed = snapshot([makeBar(49), makeBar(50), makeBar(51, 10)], makeBar(52, 10));

        const merged = mergeChartBars(refreshed, live);

        expect(merged.find((bar) => bar.barIndex === 51)?.buyUnits).toBe(50);
        expect(merged.find((bar) => bar.barIndex === 52)?.buyUnits).toBe(52);
    });

    it('bounds long-running live state to the latest snapshot-sized window', () => {
        const bars = Array.from({ length: MAX_VISIBLE_CHART_BARS + 1 }, (_value, barIndex) => makeBar(barIndex));

        const live = applyChartUpdate(emptyChartLiveState(), bars, null);

        expect(live.bars.size).toBe(MAX_VISIBLE_CHART_BARS);
        expect(live.bars.has(0)).toBe(false);
        expect(live.bars.has(MAX_VISIBLE_CHART_BARS)).toBe(true);
    });

    it('detects skipped publications without flagging contiguous catch-up chunks', () => {
        const history = snapshot([makeBar(10)], makeBar(11));
        const live = emptyChartLiveState();

        expect(chartUpdateHasGap(history, live, [], makeBar(12))).toBe(true);
        expect(chartUpdateHasGap(history, live, [makeBar(12)], makeBar(13))).toBe(true);
        expect(chartUpdateHasGap(history, live, [makeBar(11), makeBar(12)], makeBar(500))).toBe(false);

        const firstChunk = applyChartUpdate(live, [makeBar(11), makeBar(12)], makeBar(500));
        expect(chartUpdateHasGap(history, firstChunk, [makeBar(13), makeBar(14)], makeBar(500))).toBe(false);
    });
});
