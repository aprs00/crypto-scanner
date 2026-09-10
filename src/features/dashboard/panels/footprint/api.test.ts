import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
    chartSeriesRequestKey,
    chartSeriesRefetchInterval,
    createChartSeriesRequest,
    mergeSnapshotHistory,
    retireChartSeries,
    retryChartSnapshot,
    SERIES_LEASE_RENEWAL_MS,
} from './api';
import { isRetiredSeries, readCachedBars, writeCachedBars } from './chartCache';
import { isChartPending, isReplacedSeriesError } from './presentation';
import { ChartSeriesStatus, ChartType } from './types';
import { defaultFootprintSettings } from './useFootprintSettingsStore';

describe('chart series requests', () => {
    it('shares TRev identity across display lookbacks while preserving Tick identities', () => {
        const request = (chartType: typeof ChartType.Trev | typeof ChartType.Tick, lookbackDays: number) =>
            createChartSeriesRequest({ ...defaultFootprintSettings, chartType, lookbackDays }, 'test-market');
        expect(chartSeriesRequestKey(request(ChartType.Trev, 1))).toEqual(
            chartSeriesRequestKey(request(ChartType.Trev, 30)),
        );
        expect(chartSeriesRequestKey(request(ChartType.Tick, 1))).not.toEqual(
            chartSeriesRequestKey(request(ChartType.Tick, 30)),
        );
    });

    it('retries pending snapshots by series identity without treating failures as pending', () => {
        const error = (status: string) => ({
            isAxiosError: true,
            response: { data: { code: 'CHART_SERIES_NOT_READY', status }, status: 409 },
        });
        for (const status of [ChartSeriesStatus.Queued, ChartSeriesStatus.Building, ChartSeriesStatus.CatchingUp]) {
            expect(isChartPending(error(status))).toBe(true);
            expect(retryChartSnapshot(100, error(status))).toBe(true);
        }
        expect(isChartPending(error(ChartSeriesStatus.Failed))).toBe(false);
        expect(retryChartSnapshot(100, error(ChartSeriesStatus.Failed))).toBe(false);
        expect(retryChartSnapshot(0, { isAxiosError: true, response: { status: 404 } })).toBe(false);
    });

    it('keeps shared cached candles inside the snapshot history and committed bounds', () => {
        const bar = (barIndex: number) => ({
            barIndex,
            breakBefore: false,
            buyUnits: 1,
            closeTick: 100,
            highTick: 100,
            levels: [] as [number, number, number][],
            lowTick: 100,
            openedAtMs: 1_800_000_000_000,
            openTick: 100,
            quantityStep: '1',
            sellUnits: 0,
            tickSize: '1',
            tradeCount: 1,
        });
        const snapshot = {
            activeBar: bar(6),
            bars: [bar(4), bar(5)],
            hasMore: true,
            historyStartBarIndex: 2,
            nextBeforeBarIndex: 4,
            seriesKey: 'test-series',
        };
        expect(
            mergeSnapshotHistory(snapshot, [bar(0), bar(1), bar(2), bar(3), bar(6)]).map((value) => value.barIndex),
        ).toEqual([2, 3, 4, 5]);
    });

    it('retires shared query and disk caches before rediscovering repaired history', async () => {
        const client = new QueryClient();
        const queryKey = ['footprint-chart-series', 'test-market'];
        const series = { errorCode: null, seriesKey: 'retired-test-series', status: ChartSeriesStatus.Ready };
        client.setQueryData(queryKey, series);
        client.setQueryData(['footprint-chart-bars', series.seriesKey], { bars: ['old-bars'] });
        expect(retireChartSeries(client, queryKey, series)).toBe(true);
        expect(client.getQueryData(queryKey)).toEqual({ ...series, status: ChartSeriesStatus.Queued });
        expect(client.getQueryData(['footprint-chart-bars', series.seriesKey])).toBeUndefined();
        expect(isRetiredSeries(series.seriesKey)).toBe(true);
        await writeCachedBars(series.seriesKey, []);
        expect(await readCachedBars(series.seriesKey, undefined, 100)).toEqual([]);
        expect(retireChartSeries(client, queryKey, series)).toBe(false);
        expect(isRetiredSeries('new-series')).toBe(false);
        client.clear();
    });

    it('rediscovers series on replacement notices or unknown-series HTTP responses', () => {
        expect(isReplacedSeriesError('CHART_SERIES_REPLACED')).toBe(true);
        expect(isReplacedSeriesError('UNKNOWN_CHART_SERIES')).toBe(true);
        expect(isReplacedSeriesError({ isAxiosError: true, response: { status: 404 } })).toBe(true);
        expect(isReplacedSeriesError('CHART_UNAVAILABLE')).toBe(false);
        expect(isReplacedSeriesError({ isAxiosError: true, response: { status: 503 } })).toBe(false);
    });
    it('creates the default TRev request', () => {
        expect(createChartSeriesRequest(defaultFootprintSettings, 'binance:perpetual:BTCUSDT')).toEqual({
            chartType: ChartType.Trev,
            continuationTicks: 314,
            lookbackDays: 5,
            marketKey: 'binance:perpetual:BTCUSDT',
            reversalTicks: 471,
        });
    });

    it('creates the minimal Tick request', () => {
        expect(
            createChartSeriesRequest(
                { ...defaultFootprintSettings, chartType: ChartType.Tick },
                'binance:perpetual:BTCUSDT',
            ),
        ).toEqual({
            chartType: ChartType.Tick,
            lookbackDays: 5,
            marketKey: 'binance:perpetual:BTCUSDT',
            tradesPerBar: 500,
        });
    });

    it('creates the minimal TRev request', () => {
        expect(
            createChartSeriesRequest(
                {
                    ...defaultFootprintSettings,
                    chartType: ChartType.Trev,
                    continuationTicks: 25,
                    reversalTicks: 40,
                },
                'hyperliquid:perpetual:BTC',
            ),
        ).toEqual({
            chartType: ChartType.Trev,
            continuationTicks: 25,
            lookbackDays: 5,
            marketKey: 'hyperliquid:perpetual:BTC',
            reversalTicks: 40,
        });
    });

    it('renews leases without repeatedly starting catch-up while snapshots are pending', () => {
        expect(chartSeriesRefetchInterval(ChartSeriesStatus.Queued)).toBe(SERIES_LEASE_RENEWAL_MS);
        expect(chartSeriesRefetchInterval(ChartSeriesStatus.Building)).toBe(SERIES_LEASE_RENEWAL_MS);
        expect(chartSeriesRefetchInterval(ChartSeriesStatus.CatchingUp)).toBe(SERIES_LEASE_RENEWAL_MS);
        expect(chartSeriesRefetchInterval(ChartSeriesStatus.Ready)).toBe(SERIES_LEASE_RENEWAL_MS);
        expect(chartSeriesRefetchInterval(ChartSeriesStatus.Failed)).toBe(false);
    });
});
