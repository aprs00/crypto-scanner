import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import api from '@/lib/api';

import type { FootprintSettings } from './useFootprintSettingsStore';

import { mergeContiguousBars } from './barState';
import { isRetiredSeries, readCachedBars, retireCachedSeries, writeCachedBars } from './chartCache';
import { isChartPending, isReplacedSeriesError } from './presentation';
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

export const SNAPSHOT_RETRY_MS = 1_000;
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

export const chartSeriesRequestKey = (request: ChartSeriesRequest | undefined) =>
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
    return status && status !== ChartSeriesStatus.Failed ? SERIES_LEASE_RENEWAL_MS : false;
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
        queryFn: async () => {
            const series = await createChartSeries(request!);
            // POST requests catch-up once. GET retries observe its completion.
            void client.invalidateQueries({ queryKey: ['footprint-chart-bars', series.seriesKey] });
            return series;
        },
        queryKey,
        refetchInterval: (query) => chartSeriesRefetchInterval(query.state.data?.status),
        refetchOnReconnect: true,
        refetchOnMount: 'always',
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

export const fetchChartBars = async (
    seriesKey: string,
    lookbackDays: number,
    beforeBarIndex?: number,
    signal?: AbortSignal,
): Promise<ChartBarsResponse> => {
    const response = await api.get('api/v1/footprints/chart-bars', {
        params: { beforeBarIndex, lookbackDays, seriesKey },
        signal,
    });
    const snapshot = chartBarsResponseSchema.parse(response.data);
    if (snapshot.seriesKey !== seriesKey) throw new Error('Chart snapshot does not match the requested series');
    return snapshot;
};

type CachedHistory = {
    bars: ChartBarsResponse['bars'];
    exhaustedBefore?: number;
    historyStartBarIndex: number;
    scopeKey: string;
};

export const retryChartSnapshot = (count: number, error: unknown): boolean =>
    isChartPending(error) || (!isReplacedSeriesError(error) && count < 3);

export const mergeSnapshotHistory = (snapshot: ChartBarsResponse, cached: ChartBarsResponse['bars']) => {
    const newestClosed = snapshot.bars.at(-1)?.barIndex ?? -1;
    return mergeContiguousBars(
        cached.filter((bar) => bar.barIndex >= snapshot.historyStartBarIndex && bar.barIndex <= newestClosed),
        snapshot.bars,
    );
};

const useChartBars = (
    seriesKey: string | undefined,
    lookbackDays: number,
    onSeriesReplaced?: (key: string) => void,
) => {
    const client = useQueryClient();
    const scopeKey = JSON.stringify([seriesKey, lookbackDays]);
    const query = useQuery({
        enabled: Boolean(seriesKey && !isRetiredSeries(seriesKey)),
        queryFn: ({ signal }) => fetchChartBars(seriesKey!, lookbackDays, undefined, signal),
        queryKey: ['footprint-chart-bars', seriesKey, lookbackDays],
        refetchOnMount: 'always',
        retry: retryChartSnapshot,
        retryDelay: SNAPSHOT_RETRY_MS,
        staleTime: Infinity,
    });
    // Cached query/IndexedDB data cannot satisfy the first render after opening.
    // Once accepted, keep the chart visible during later refreshes and outages.
    const accepted = useRef({ ready: false, scopeKey });
    if (accepted.current.scopeKey !== scopeKey) accepted.current = { ready: false, scopeKey };
    if (query.isFetchedAfterMount && query.isSuccess && !query.isFetching) accepted.current.ready = true;
    const snapshotReady = accepted.current.ready && Boolean(query.data);
    const [history, setHistory] = useState<CachedHistory>({ bars: [], historyStartBarIndex: 0, scopeKey: '' });
    const [loadingScope, setLoadingScope] = useState<string>();
    const loadingOlderRef = useRef<string | undefined>(undefined);
    const scopeRef = useRef(scopeKey);
    const historyRef = useRef(history);
    scopeRef.current = scopeKey;
    historyRef.current = history;

    useEffect(() => {
        if (seriesKey && isReplacedSeriesError(query.error)) onSeriesReplaced?.(seriesKey);
    }, [onSeriesReplaced, query.error, seriesKey]);

    useEffect(() => {
        let disposed = false;
        setHistory({ bars: [], historyStartBarIndex: 0, scopeKey });
        if (!snapshotReady || !seriesKey) return;
        void readCachedBars(seriesKey, undefined, CHART_WIRE_LIMITS.httpBars)
            .then((bars) => {
                if (disposed || bars.length === 0) return;
                setHistory((current) => ({
                    ...current,
                    bars: mergeContiguousBars(current.scopeKey === scopeKey ? current.bars : [], bars),
                    scopeKey,
                }));
            })
            .catch(() => undefined);
        return () => {
            disposed = true;
        };
    }, [scopeKey, seriesKey, snapshotReady]);

    useEffect(() => {
        if (!snapshotReady || !seriesKey || !query.data) return;
        const snapshot = query.data;
        client.setQueriesData<ChartSeriesResponse>({ queryKey: ['footprint-chart-series'] }, (current) =>
            current?.seriesKey === seriesKey && current.status !== ChartSeriesStatus.Ready
                ? { ...current, errorCode: null, status: ChartSeriesStatus.Ready }
                : current,
        );
        setHistory((current) => ({
            bars: mergeSnapshotHistory(snapshot, current.scopeKey === scopeKey ? current.bars : []),
            exhaustedBefore: current.scopeKey === scopeKey ? current.exhaustedBefore : undefined,
            historyStartBarIndex: Math.max(
                snapshot.historyStartBarIndex,
                current.scopeKey === scopeKey ? current.historyStartBarIndex : 0,
            ),
            scopeKey,
        }));
        void writeCachedBars(seriesKey, snapshot.bars).catch(() => undefined);
    }, [client, query.data, scopeKey, seriesKey, snapshotReady]);

    const scopedHistory = history.scopeKey === scopeKey ? history : undefined;
    const historyStartBarIndex = Math.max(
        query.data?.historyStartBarIndex ?? 0,
        scopedHistory?.historyStartBarIndex ?? 0,
    );
    const bars = query.data
        ? mergeSnapshotHistory({ ...query.data, historyStartBarIndex }, scopedHistory?.bars ?? [])
        : [];
    const oldestBarIndex = bars[0]?.barIndex;
    const exhausted = scopedHistory?.exhaustedBefore === oldestBarIndex;
    const hasMore =
        snapshotReady && !exhausted && oldestBarIndex !== undefined && oldestBarIndex > historyStartBarIndex;
    const data =
        snapshotReady && query.data && seriesKey
            ? {
                  activeBar: query.data.activeBar,
                  bars,
                  coverage: query.data.coverage,
                  hasMore,
                  historyStartBarIndex,
                  nextBeforeBarIndex: hasMore ? oldestBarIndex : null,
                  seriesKey,
              }
            : undefined;

    const loadOlder = async () => {
        if (!seriesKey || !data || !hasMore || loadingOlderRef.current === scopeKey) return;
        const current = historyRef.current.scopeKey === scopeKey ? historyRef.current.bars : [];
        const beforeBarIndex = mergeSnapshotHistory(data, current)[0]?.barIndex;
        if (beforeBarIndex === undefined || beforeBarIndex <= historyStartBarIndex) return;
        loadingOlderRef.current = scopeKey;
        setLoadingScope(scopeKey);
        try {
            const cached = await readCachedBars(seriesKey, beforeBarIndex, CHART_WIRE_LIMITS.httpBars).catch(() => []);
            if (scopeRef.current !== scopeKey) return;
            if (cached.length > 0) {
                setHistory((value) => ({
                    bars: mergeSnapshotHistory(
                        data,
                        mergeContiguousBars(value.scopeKey === scopeKey ? value.bars : [], cached),
                    ),
                    exhaustedBefore: value.scopeKey === scopeKey ? value.exhaustedBefore : undefined,
                    historyStartBarIndex,
                    scopeKey,
                }));
            }
            const page = await fetchChartBars(seriesKey, lookbackDays, beforeBarIndex);
            if (scopeRef.current !== scopeKey) return;
            setHistory((value) => ({
                bars: mergeContiguousBars(value.scopeKey === scopeKey ? value.bars : [], data.bars, page.bars),
                exhaustedBefore: page.hasMore ? undefined : (page.bars[0]?.barIndex ?? beforeBarIndex),
                historyStartBarIndex: Math.max(historyStartBarIndex, page.historyStartBarIndex),
                scopeKey,
            }));
            await writeCachedBars(seriesKey, page.bars).catch(() => undefined);
        } catch (error) {
            if (isReplacedSeriesError(error)) onSeriesReplaced?.(seriesKey);
            // History remains usable from memory or IndexedDB when an older
            // network page is temporarily unavailable.
        } finally {
            if (loadingOlderRef.current === scopeKey) {
                loadingOlderRef.current = undefined;
                setLoadingScope(undefined);
            }
        }
    };

    return {
        ...query,
        catchingUp: isChartPending(query.failureReason),
        data,
        hasMore,
        loadOlder,
        loadingOlder: loadingScope === scopeKey,
    };
};

export { useChartBars, useChartSeries, useFootprintMarkets };
