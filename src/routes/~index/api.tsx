import {useQuery} from '@tanstack/react-query';

import {API_URL} from '@/config/env';
import {api} from '@/lib/ky';

import type {
    AveragePriceChangeResponse,
    BetaHeatmapResponse,
    SelectOption,
    SelectOptionsResponse,
    ZScoreHistoryResponse,
    ZScoreMatrixResponse,
} from './types';

const fetchPriceChangePercentage = async (symbol: string, duration: string, type: string) => {
    const url = new URL('average-prices', API_URL);
    url.searchParams.set('duration', duration);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('type', type);

    return (await api.get(url).json()) as AveragePriceChangeResponse;
};

const usePriceChangePercentage = (symbol: string, duration: string, type: string) => {
    return useQuery({
        gcTime: 120_000,
        queryFn: () => fetchPriceChangePercentage(symbol, duration, type),
        queryKey: ['price-change-percentage', symbol, duration, type],
        refetchInterval: 120_000,
        refetchOnWindowFocus: false,
        staleTime: 120_000,
    });
};

const fetchTickersOptions = async () => {
    const url = new URL('tickers-options', API_URL);

    return (await api.get(url).json()) as SelectOption[];
};

const useFetchTickersOptions = () => {
    return useQuery({
        gcTime: 60 * 60 * 1000,
        queryFn: () => fetchTickersOptions(),
        queryKey: ['ticker-options'],
        refetchInterval: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        staleTime: 60 * 60 * 1000,
    });
};

const fetchBetaHeatmapData = async (duration: string) => {
    const url = new URL('pearson-correlation', API_URL);
    url.searchParams.set('duration', duration);

    return (await api.get(url).json()) as BetaHeatmapResponse;
};

const useBetaHeatmapData = (duration: string) => {
    return useQuery({
        gcTime: 120_000,
        queryFn: () => fetchBetaHeatmapData(duration),
        queryKey: ['beta-heatmap-data', duration],
        refetchInterval: 120_000,
        refetchOnWindowFocus: false,
        staleTime: 120_000,
    });
};

const fetchZScoreMatrix = async (xAxis: string, yAxis: string, duration: string) => {
    const url = new URL('z-score-matrix', API_URL);
    url.searchParams.set('duration', duration);
    url.searchParams.set('x_axis', xAxis);
    url.searchParams.set('y_axis', yAxis);

    return (await api.get(url).json()) as ZScoreMatrixResponse[];
};

const useZScoreMatrix = (xAxis: string, yAxis: string, duration: string) => {
    return useQuery({
        gcTime: 120_000,
        queryFn: () => fetchZScoreMatrix(xAxis, yAxis, duration),
        queryKey: ['z-score-matrix', xAxis, yAxis, duration],
        refetchInterval: 120_000,
        refetchOnWindowFocus: false,
        staleTime: 120_000,
    });
};

const fetchZScoreHistory = async (type: string, duration: string) => {
    const url = new URL('z-score-history', API_URL);
    url.searchParams.set('duration', duration);
    url.searchParams.set('type', type);

    return (await api.get(url).json()) as ZScoreHistoryResponse;
};

const useZScoreHistory = (type: string, duration: string) => {
    return useQuery({
        gcTime: 120_000,
        queryFn: () => fetchZScoreHistory(type, duration),
        queryKey: ['z-score-history', type, duration],
        refetchInterval: 120_000,
        refetchOnWindowFocus: false,
        staleTime: 120_000,
    });
};

const fetchStatsSelectOptions = async () => {
    const url = new URL(`stats-select-options`, API_URL);

    return (await api.get(url).json()) as SelectOptionsResponse;
};

const useStatsSelectOptions = () => {
    return useQuery({
        gcTime: 60 * 60 * 1000,
        queryFn: () => fetchStatsSelectOptions(),
        queryKey: ['stats-select-options'],
        refetchInterval: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        staleTime: 60 * 60 * 1000,
    });
};

export {
    useBetaHeatmapData,
    useFetchTickersOptions,
    usePriceChangePercentage,
    useStatsSelectOptions,
    useZScoreHistory,
    useZScoreMatrix,
};
