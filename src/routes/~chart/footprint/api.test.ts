import { describe, expect, it } from 'vitest';

import { chartSeriesRefetchInterval, createChartSeriesRequest, SERIES_LEASE_RENEWAL_MS } from './api';
import { ChartSeriesStatus, ChartType } from './types';
import { defaultFootprintSettings } from './useFootprintSettingsStore';

describe('chart series requests', () => {
    it('creates the minimal Tick request', () => {
        expect(createChartSeriesRequest(defaultFootprintSettings, 'binance:perpetual:BTCUSDT')).toEqual({
            chartType: ChartType.Tick,
            lookbackDays: 2,
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
            lookbackDays: 2,
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
