import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import api from '@/lib/api';

import type { FootprintSettings } from './useFootprintSettingsStore';

import { mergeContiguousBars } from './barState';
import { isRetiredSeries, readCachedBars, retireCachedSeries, writeCachedBars } from './chartCache';
import { isReplacedSeriesError } from './presentation';
import {
    chartBarsResponseSchema,
    chartSeriesResponseSchema,
    CHART_WIRE_LIMITS,
    ChartSeriesStatus,
    ChartType,
    footprintMarketsResponseSchema,
    type ChartBarsResponse,
    type ChartSeriesResponse,
} from './types';

const SERIES_POLL_MS = 100;
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
    lookbackDays: number;
    marketKey: string;
    tradesPerBar: number;
};

type TrevSeriesRequest = {
    chartType: typeof ChartType.Trev;
    continuationTicks: number;
    lookbackDays: number;
    marketKey: string;
    reversalTicks: number;
};

type ChartSeriesRequest = TickSeriesRequest | TrevSeriesRequest;

export const createChartSeriesRequest = (settings: FootprintSettings, marketKey: string): ChartSeriesRequest =>
    settings.chartType === ChartType.Tick
        ? {
              chartType: ChartType.Tick,
              lookbackDays: settings.lookbackDays,
              marketKey,
              tradesPerBar: settings.tradesPerBar,
          }
        : {
              chartType: ChartType.Trev,
              continuationTicks: settings.continuationTicks,
              lookbackDays: settings.lookbackDays,
              marketKey,
              reversalTicks: settings.reversalTicks,
          };

const chartSeriesRequestKey = (request: ChartSeriesRequest | undefined) =>
    request?.chartType === ChartType.Tick
        ? [request.marketKey, request.chartType, request.tradesPerBar, request.lookbackDays]
        : [
              request?.marketKey,
              request?.chartType,
              request?.continuationTicks,
              request?.reversalTicks,
              request?.lookbackDays,
          ];

const createChartSeries = async (request: ChartSeriesRequest): Promise<ChartSeriesResponse> => {
    const response = await api.post('api/v1/footprints/chart-series', request);
    return chartSeriesResponseSchema.parse(response.data);
};

export const chartSeriesRefetchInterval = (status: ChartSeriesStatus | undefined): number | false => {
    if (status === ChartSeriesStatus.Queued || status === ChartSeriesStatus.Building) return SERIES_POLL_MS;
    return status === ChartSeriesStatus.Ready ? SERIES_LEASE_RENEWAL_MS : false;
};

export const retireChartSeries = (client: QueryClient, queryKey: unknown[], series: ChartSeriesResponse): boolean => {
    if (isRetiredSeries(series.seriesKey)) return false;
    void retireCachedSeries(series.seriesKey).catch(() => undefined);
    void client.cancelQueries({ queryKey: ['footprint-chart-bars', series.seriesKey] });
    client.removeQueries({ queryKey: ['footprint-chart-bars', series.seriesKey] });
    client.setQueryData<ChartSeriesResponse>(queryKey, { ...series, status: ChartSeriesStatus.Queued });
    return true;
};

const useChartSeries = (request: ChartSeriesRequest | undefined) => {
    const client = useQueryClient();
    const queryKey = ['footprint-chart-series', ...chartSeriesRequestKey(request)];
    const query = useQuery({
        enabled: Boolean(request),
        queryFn: () => createChartSeries(request!),
        queryKey,
        refetchInterval: (query) => chartSeriesRefetchInterval(query.state.data?.status),
        refetchOnReconnect: true,
        refetchOnWindowFocus: 'always',
        staleTime: 1_000,
    });
    const requestScope = JSON.stringify(queryKey);
    const previous = useRef({ requestScope, seriesKey: query.data?.seriesKey });
    useEffect(() => {
        const old = previous.current;
        const currentKey = query.data?.seriesKey;
        previous.current = { requestScope, seriesKey: currentKey };
        // Periodic lease renewal also discovers replacements if a WS notice was lost.
        if (old.requestScope !== requestScope || !old.seriesKey || !currentKey || old.seriesKey === currentKey) return;
        void retireCachedSeries(old.seriesKey).catch(() => undefined);
        client.removeQueries({ queryKey: ['footprint-chart-bars', old.seriesKey] });
    }, [client, query.data?.seriesKey, requestScope]);
    const replaceSeries = (seriesKey: string) => {
        if (query.data?.seriesKey !== seriesKey) return;
        // Shared query state disables the retired feed in every matching panel.
        if (retireChartSeries(client, queryKey, query.data)) void query.refetch();
    };
    return { ...query, replaceSeries };
};

const fetchChartBars = async (seriesKey: string, beforeBarIndex?: number): Promise<ChartBarsResponse> => {
    const response = await api.get('api/v1/footprints/chart-bars', {
        params: { beforeBarIndex, seriesKey },
    });
    const snapshot = chartBarsResponseSchema.parse(response.data);
    if (snapshot.seriesKey !== seriesKey) throw new Error('Chart snapshot does not match the requested series');
    return snapshot;
};

type CachedHistory = {
    bars: ChartBarsResponse['bars'];
    exhaustedBefore?: number;
    seriesKey: string;
};

const useChartBars = (seriesKey: string | undefined, enabled: boolean, onSeriesReplaced?: (key: string) => void) => {
    const query = useQuery({
        enabled: Boolean(enabled && seriesKey),
        queryFn: () => fetchChartBars(seriesKey!),
        queryKey: ['footprint-chart-bars', seriesKey],
        retry: (count, error) => !isReplacedSeriesError(error) && count < 3,
        staleTime: Infinity,
    });
    const [history, setHistory] = useState<CachedHistory>({ bars: [], seriesKey: '' });
    const [loadingOlder, setLoadingOlder] = useState(false);
    const loadingOlderRef = useRef(false);
    const seriesKeyRef = useRef(seriesKey);
    const historyRef = useRef(history);
    seriesKeyRef.current = seriesKey;
    historyRef.current = history;

    useEffect(() => {
        if (seriesKey && isReplacedSeriesError(query.error)) onSeriesReplaced?.(seriesKey);
    }, [onSeriesReplaced, query.error, seriesKey]);

    useEffect(() => {
        let disposed = false;
        setHistory({ bars: [], seriesKey: seriesKey ?? '' });
        if (!enabled || !seriesKey) return;
        void readCachedBars(seriesKey, undefined, CHART_WIRE_LIMITS.httpBars)
            .then((bars) => {
                if (disposed || bars.length === 0) return;
                setHistory((current) => ({
                    bars: mergeContiguousBars(current.seriesKey === seriesKey ? current.bars : [], bars),
                    exhaustedBefore: current.seriesKey === seriesKey ? current.exhaustedBefore : undefined,
                    seriesKey,
                }));
            })
            .catch(() => undefined);
        return () => {
            disposed = true;
        };
    }, [enabled, seriesKey]);

    useEffect(() => {
        if (!seriesKey || !query.data) return;
        setHistory((current) => ({
            bars: mergeContiguousBars(current.seriesKey === seriesKey ? current.bars : [], query.data.bars),
            exhaustedBefore: current.seriesKey === seriesKey ? current.exhaustedBefore : undefined,
            seriesKey,
        }));
        void writeCachedBars(seriesKey, query.data.bars).catch(() => undefined);
    }, [query.data, seriesKey]);

    const scopedHistory = history.seriesKey === seriesKey ? history.bars : [];
    const bars = mergeContiguousBars(scopedHistory, query.data?.bars ?? []);
    const oldestBarIndex = bars[0]?.barIndex;
    const exhausted = history.seriesKey === seriesKey && history.exhaustedBefore === oldestBarIndex;
    const hasMore = !exhausted && oldestBarIndex !== undefined && oldestBarIndex > 0;
    const data =
        (query.data || bars.length > 0) && seriesKey
            ? {
                  activeBar: query.data?.activeBar ?? null,
                  bars,
                  hasMore,
                  nextBeforeBarIndex: hasMore ? oldestBarIndex : null,
                  seriesKey,
              }
            : undefined;

    const loadOlder = async () => {
        if (!seriesKey || loadingOlderRef.current) return;
        const current = historyRef.current.seriesKey === seriesKey ? historyRef.current.bars : [];
        const beforeBarIndex = mergeContiguousBars(current, query.data?.bars ?? [])[0]?.barIndex;
        if (beforeBarIndex === undefined || beforeBarIndex <= 0) return;
        loadingOlderRef.current = true;
        setLoadingOlder(true);
        try {
            const cached = await readCachedBars(seriesKey, beforeBarIndex, CHART_WIRE_LIMITS.httpBars).catch(() => []);
            if (seriesKeyRef.current !== seriesKey) return;
            if (cached.length > 0) {
                setHistory((value) => ({
                    bars: mergeContiguousBars(
                        value.seriesKey === seriesKey ? value.bars : [],
                        query.data?.bars ?? [],
                        cached,
                    ),
                    exhaustedBefore: value.seriesKey === seriesKey ? value.exhaustedBefore : undefined,
                    seriesKey,
                }));
            }
            const page = await fetchChartBars(seriesKey, beforeBarIndex);
            if (seriesKeyRef.current !== seriesKey) return;
            setHistory((value) => ({
                bars: mergeContiguousBars(
                    value.seriesKey === seriesKey ? value.bars : [],
                    query.data?.bars ?? [],
                    page.bars,
                ),
                exhaustedBefore: page.hasMore ? undefined : (page.bars[0]?.barIndex ?? beforeBarIndex),
                seriesKey,
            }));
            await writeCachedBars(seriesKey, page.bars).catch(() => undefined);
        } catch (error) {
            if (isReplacedSeriesError(error)) onSeriesReplaced?.(seriesKey);
            // History remains usable from memory or IndexedDB when an older
            // network page is temporarily unavailable.
        } finally {
            loadingOlderRef.current = false;
            setLoadingOlder(false);
        }
    };

    return { ...query, data, hasMore, loadOlder, loadingOlder };
};

export { useChartBars, useChartSeries, useFootprintMarkets };
