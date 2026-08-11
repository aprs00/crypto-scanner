import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';

import type { FootprintSettings } from './useFootprintSettingsStore';

import {
    chartBarsResponseSchema,
    chartSeriesResponseSchema,
    ChartSeriesStatus,
    ChartType,
    footprintMarketsResponseSchema,
    type ChartBarsResponse,
    type ChartSeriesResponse,
} from './types';

const SERIES_POLL_MS = 1_000;
export const SERIES_LEASE_RENEWAL_MS = 5 * 60_000;

const fetchFootprintMarkets = async () => {
    const response = await api.get('api/v1/footprints/markets');
    return footprintMarketsResponseSchema.parse(response.data);
};

const useFootprintMarkets = () =>
    useQuery({
        queryFn: fetchFootprintMarkets,
        queryKey: ['footprint-markets'],
        staleTime: 30_000,
    });

type TickSeriesRequest = {
    chartType: typeof ChartType.Tick;
    marketKey: string;
    tradesPerBar: number;
};

type TrevSeriesRequest = {
    chartType: typeof ChartType.Trev;
    continuationTicks: number;
    marketKey: string;
    reversalTicks: number;
};

type ChartSeriesRequest = TickSeriesRequest | TrevSeriesRequest;

export const createChartSeriesRequest = (settings: FootprintSettings, marketKey: string): ChartSeriesRequest =>
    settings.chartType === ChartType.Tick
        ? {
              chartType: ChartType.Tick,
              marketKey,
              tradesPerBar: settings.tradesPerBar,
          }
        : {
              chartType: ChartType.Trev,
              continuationTicks: settings.continuationTicks,
              marketKey,
              reversalTicks: settings.reversalTicks,
          };

const chartSeriesRequestKey = (request: ChartSeriesRequest | undefined) =>
    request?.chartType === ChartType.Tick
        ? [request.marketKey, request.chartType, request.tradesPerBar]
        : [request?.marketKey, request?.chartType, request?.continuationTicks, request?.reversalTicks];

const createChartSeries = async (request: ChartSeriesRequest): Promise<ChartSeriesResponse> => {
    const response = await api.post('api/v1/footprints/chart-series', request);
    return chartSeriesResponseSchema.parse(response.data);
};

export const chartSeriesRefetchInterval = (status: ChartSeriesStatus | undefined): number | false => {
    if (status === ChartSeriesStatus.Queued || status === ChartSeriesStatus.Building) return SERIES_POLL_MS;
    return status === ChartSeriesStatus.Ready ? SERIES_LEASE_RENEWAL_MS : false;
};

const useChartSeries = (request: ChartSeriesRequest | undefined) =>
    useQuery({
        enabled: Boolean(request),
        queryFn: () => createChartSeries(request!),
        queryKey: ['footprint-chart-series', ...chartSeriesRequestKey(request)],
        refetchInterval: (query) => chartSeriesRefetchInterval(query.state.data?.status),
        refetchOnReconnect: true,
        refetchOnWindowFocus: 'always',
        staleTime: 1_000,
    });

const fetchChartBars = async (seriesKey: string): Promise<ChartBarsResponse> => {
    const response = await api.get('api/v1/footprints/chart-bars', { params: { seriesKey } });
    const snapshot = chartBarsResponseSchema.parse(response.data);
    if (snapshot.seriesKey !== seriesKey) throw new Error('Chart snapshot does not match the requested series');
    return snapshot;
};

const useChartBars = (seriesKey: string | undefined, enabled: boolean) =>
    useQuery({
        enabled: Boolean(enabled && seriesKey),
        queryFn: () => fetchChartBars(seriesKey!),
        queryKey: ['footprint-chart-bars', seriesKey],
        staleTime: Infinity,
    });

export { useChartBars, useChartSeries, useFootprintMarkets };
