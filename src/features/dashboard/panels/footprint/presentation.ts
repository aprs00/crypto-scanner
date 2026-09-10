import { isAxiosError } from 'axios';

import { ChartSeriesStatus, ChartType, type ChartType as ChartTypeValue } from './types';

export const isChartPending = (error: unknown): boolean => {
    if (!isAxiosError(error) || error.response?.status !== 409) return false;
    const data = error.response.data;
    return (
        data?.code === 'CHART_SERIES_NOT_READY' &&
        [ChartSeriesStatus.Queued, ChartSeriesStatus.Building, ChartSeriesStatus.CatchingUp].some(
            (status) => status === data.status,
        )
    );
};

export const footprintErrorCode = (error: unknown): string | undefined => {
    if (typeof error === 'string') return error;
    if (isAxiosError(error)) {
        const data = error.response?.data;
        if (data?.code === 'CHART_SERIES_NOT_READY' && data.status === ChartSeriesStatus.Failed) {
            return typeof data.errorCode === 'string' ? data.errorCode : 'CHART_SERIES_FAILED';
        }
        if (typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string') {
            return data.code;
        }
    }
    return error instanceof Error && error.message ? error.message : undefined;
};

export const chartErrorLabel = (code: string | null | undefined, chartType: ChartTypeValue): string => {
    if (code === 'CHART_SERIES_REPLACED') return 'Rebuilding chart with verified trade history…';
    if (code === 'SERIES_CAPACITY_REACHED') return 'Footprint chart capacity is full. Try again later';
    if (code === 'CHART_BAR_TOO_DENSE') return 'This chart produced too many footprint price levels';
    if (code === 'TREV_EXPANSION_LIMIT') return 'This TRev configuration creates too many synthetic bars';
    if (code === 'CHART_SERIES_NOT_READY') return 'Chart history is still building';
    if (code === 'CHART_UNAVAILABLE') return 'Chart storage is temporarily unavailable';
    if (code === 'TOO_MANY_CHART_SUBSCRIPTIONS') return 'Too many footprint charts are open';
    const label = chartType === ChartType.Trev ? 'TRev' : 'tick';
    return code ? `Unable to load ${label} chart (${code})` : `Unable to load ${label} chart`;
};

export const isReplacedSeriesError = (error: unknown) =>
    ['CHART_SERIES_REPLACED', 'UNKNOWN_CHART_SERIES'].includes(footprintErrorCode(error) ?? '') ||
    (isAxiosError(error) && error.response?.status === 404);
