import { describe, expect, it } from 'vitest';

import { FootprintSeries, rebinFootprintLevels, toFootprintSeriesData } from './FootprintSeries';
import {
    chartBarsResponseSchema,
    chartSeriesResponseSchema,
    chartSocketMessageSchema,
    CHART_WIRE_LIMITS,
    ChartSeriesStatus,
    footprintMarketsResponseSchema,
    type ChartBar,
} from './types';

const chartBar: ChartBar = {
    barIndex: 80,
    breakBefore: false,
    buyUnits: 9,
    closeTick: 102,
    highTick: 103,
    levels: [[101, 5, 4]],
    lowTick: 99,
    openedAtMs: 1_800_000_000_000,
    openTick: 100,
    quantityStep: '0.001',
    sellUnits: 7,
    tickSize: '0.5',
    tradeCount: 12,
};

const chartBarWithLevels = (levelCount: number): ChartBar => ({
    ...chartBar,
    levels: Array.from({ length: levelCount }, (_value, index) => [index + 1, 1, 1]),
});

const historyPage = {
    hasMore: false,
    historyStartBarIndex: 0,
    nextBeforeBarIndex: null,
};

describe('chart wire schemas', () => {
    it('retains coverage and accepts status updates without changing bars', () => {
        const coverage = { status: 'repair_pending', verifiedThroughMs: 1_800_000_000_000 };
        expect(
            chartSeriesResponseSchema.parse({
                coverage,
                errorCode: null,
                seriesKey: 'rust-series',
                status: ChartSeriesStatus.Ready,
            }).coverage,
        ).toEqual(coverage);
        expect(chartSocketMessageSchema.parse({ coverage, seriesKey: 'rust-series', type: 'coverage' })).toEqual({
            coverage,
            seriesKey: 'rust-series',
            type: 'coverage',
        });
        expect(
            chartSocketMessageSchema.safeParse({
                coverage: { ...coverage, status: 'complete' },
                seriesKey: 'rust-series',
                type: 'coverage',
            }).success,
        ).toBe(false);
    });
    it('accepts the minimal series response', () => {
        expect(
            chartSeriesResponseSchema.parse({
                errorCode: null,
                seriesKey: 'series-1',
                status: ChartSeriesStatus.Ready,
            }),
        ).toEqual({
            errorCode: null,
            seriesKey: 'series-1',
            status: ChartSeriesStatus.Ready,
        });
    });

    it('accepts the minimal footprint market catalog', () => {
        const result = footprintMarketsResponseSchema.parse({
            markets: [
                {
                    baseAsset: 'BTC',
                    currentTickSize: '0.1',
                    exchange: 'binance',
                    marketKey: 'binance:perpetual:BTCUSDT',
                    symbol: 'BTCUSDT',
                },
            ],
        });

        expect(result.markets[0]?.currentTickSize).toBe('0.1');
    });

    it('parses the bounded snapshot with native levels', () => {
        const result = chartBarsResponseSchema.parse({
            activeBar: chartBar,
            bars: [{ ...chartBar, barIndex: 79 }],
            ...historyPage,
            seriesKey: 'series-1',
        });

        expect(result.bars[0]?.levels[0]).toEqual([101, 5, 4]);
        expect(result.activeBar?.barIndex).toBe(80);
    });

    it('parses subscribed, absolute update, and scoped error messages', () => {
        expect(chartSocketMessageSchema.parse({ seriesKey: 'series-1', type: 'subscribed' }).type).toBe('subscribed');
        expect(
            chartSocketMessageSchema.parse({
                activeBar: chartBar,
                bars: [],
                seriesKey: 'series-1',
                type: 'update',
            }).type,
        ).toBe('update');
        expect(
            chartSocketMessageSchema.parse({ code: 'CHART_UNAVAILABLE', seriesKey: 'series-1', type: 'error' }),
        ).toMatchObject({ code: 'CHART_UNAVAILABLE', seriesKey: 'series-1' });
    });

    it('rejects snapshots above the bar, closed-bar, or aggregate-level limits', () => {
        expect(
            chartBarsResponseSchema.safeParse({
                activeBar: null,
                bars: Array.from({ length: 10 }, () => chartBarWithLevels(CHART_WIRE_LIMITS.barLevels)),
                ...historyPage,
                seriesKey: 'series-1',
            }).success,
        ).toBe(true);
        expect(
            chartBarsResponseSchema.safeParse({
                activeBar: null,
                bars: [chartBarWithLevels(CHART_WIRE_LIMITS.barLevels + 1)],
                ...historyPage,
                seriesKey: 'series-1',
            }).success,
        ).toBe(false);
        expect(
            chartBarsResponseSchema.safeParse({
                activeBar: null,
                bars: Array.from({ length: CHART_WIRE_LIMITS.httpBars + 1 }, () => chartBar),
                ...historyPage,
                seriesKey: 'series-1',
            }).success,
        ).toBe(false);
        expect(
            chartBarsResponseSchema.safeParse({
                activeBar: chartBarWithLevels(CHART_WIRE_LIMITS.barLevels),
                bars: Array.from({ length: 10 }, () => chartBarWithLevels(CHART_WIRE_LIMITS.barLevels)),
                ...historyPage,
                seriesKey: 'series-1',
            }).success,
        ).toBe(false);
    });

    it('rejects live updates above the bar, closed-bar, or aggregate-level limits', () => {
        expect(
            chartSocketMessageSchema.safeParse({
                activeBar: null,
                bars: Array.from({ length: 2 }, () => chartBarWithLevels(CHART_WIRE_LIMITS.barLevels)),
                seriesKey: 'series-1',
                type: 'update',
            }).success,
        ).toBe(true);
        expect(
            chartSocketMessageSchema.safeParse({
                activeBar: null,
                bars: Array.from({ length: CHART_WIRE_LIMITS.updateBars + 1 }, () => chartBar),
                seriesKey: 'series-1',
                type: 'update',
            }).success,
        ).toBe(false);
        expect(
            chartSocketMessageSchema.safeParse({
                activeBar: chartBarWithLevels(CHART_WIRE_LIMITS.barLevels),
                bars: [chartBarWithLevels(CHART_WIRE_LIMITS.barLevels), chartBarWithLevels(1)],
                seriesKey: 'series-1',
                type: 'update',
            }).success,
        ).toBe(false);
    });
});

describe('footprint series conversion', () => {
    it('groups native price levels on the client', () => {
        expect(
            rebinFootprintLevels(
                {
                    ...chartBar,
                    levels: [
                        [100, 1, 2],
                        [101, 3, 4],
                    ],
                },
                5,
            ),
        ).toEqual([{ buyQuantity: 4, priceTick: 100, sellQuantity: 6 }]);
    });

    it('converts integer wire quantities and prices for display', () => {
        const point = toFootprintSeriesData(chartBar, 1);

        expect(point).toMatchObject({
            close: 51,
            levels: [{ buyQuantity: 0.005, price: 50.5, sellQuantity: 0.004 }],
            open: 50,
            sellQuantity: 0.007,
            time: 80,
        });
        expect(point.buyQuantity).toBeCloseTo(0.009);
    });

    it('autoscales through both edges of grouped footprint rows', () => {
        const point = toFootprintSeriesData(
            {
                ...chartBar,
                closeTick: 102,
                highTick: 103,
                levels: [[101, 5, 4]],
                lowTick: 101,
                openTick: 102,
            },
            5,
        );

        expect(new FootprintSeries().priceValueBuilder(point)).toEqual([52.5, 50, 51]);
    });

    it('uses ordinal bar indexes so equal execution timestamps remain distinct', () => {
        const first = toFootprintSeriesData(chartBar, 1);
        const second = toFootprintSeriesData({ ...chartBar, barIndex: 81 }, 1);

        expect(chartBar.openedAtMs).toBe(1_800_000_000_000);
        expect(first.time).toBe(80);
        expect(second.time).toBe(81);
    });
});
