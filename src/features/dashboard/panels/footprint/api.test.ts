import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
    chartSeriesRefetchInterval,
    createChartSeriesRequest,
    retireChartSeries,
    SERIES_LEASE_RENEWAL_MS,
} from './api';
import { isRetiredSeries, readCachedBars, writeCachedBars } from './chartCache';
import { isReplacedSeriesError } from './presentation';
import { ChartSeriesStatus, ChartType } from './types';
import { defaultFootprintSettings } from './useFootprintSettingsStore';

describe('chart series requests', () => {
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

    it('polls builds and renews ready-series leases every five minutes', () => {
        expect(chartSeriesRefetchInterval(ChartSeriesStatus.Queued)).toBe(100);
        expect(chartSeriesRefetchInterval(ChartSeriesStatus.Building)).toBe(100);
        expect(chartSeriesRefetchInterval(ChartSeriesStatus.Ready)).toBe(SERIES_LEASE_RENEWAL_MS);
        expect(chartSeriesRefetchInterval(ChartSeriesStatus.Failed)).toBe(false);
    });
});
