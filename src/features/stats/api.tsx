import {useQuery} from '@tanstack/react-query';

import {API_URL} from '@/config/env';
import {api} from '@/lib/ky';

import type {
    AveragePriceChangeResponseType,
    BetaHeatmapResponseType,
    SelectOptionsResponseType,
    SelectOptionType,
    ZScoreHistoryResponseType,
    ZScoreMatrixResponseType,
} from './types';

const fetchPriceChangePercentage = async (symbol: string, duration: string, type: string) => {
    const url = new URL('average-prices', API_URL);
    url.searchParams.set('duration', duration);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('type', type);

    const data = (await api.get(url).json()) as AveragePriceChangeResponseType;
    return data;
};

const usePriceChangePercentage = (symbol: string, duration: string, type: string) => {
    return useQuery({
        queryKey: ['price-change-percentage', symbol, duration, type],
        queryFn: () => fetchPriceChangePercentage(symbol, duration, type),
        cacheTime: 120_000,
        refetchInterval: 120_000,
        staleTime: 120_000,
        refetchOnWindowFocus: false,
    });
};

const fetchTickersOptions = async () => {
    const url = new URL('tickers-options', API_URL);

    const data = (await api.get(url).json()) as SelectOptionType[];
    return data;
};

const useFetchTickersOptions = () => {
    return useQuery({
        queryKey: ['ticker-options'],
        queryFn: () => fetchTickersOptions(),
        cacheTime: 60 * 60 * 1000,
        refetchInterval: 60 * 60 * 1000,
        staleTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

const fetchPearsonCorrelation = async () => {
    const url = new URL('test-redis-data', API_URL);

    return (await api.get(url).json()) as BetaHeatmapResponseType;
};

const usePearsonCorrelation = () => {
    return useQuery({
        queryKey: ['pearson-correlation'],
        queryFn: () => fetchPearsonCorrelation(),
        cacheTime: 15_000,
        refetchInterval: 15_000,
        staleTime: 15_000,
        refetchOnWindowFocus: false,
    });
};

const fetchBetaHeatmapData = async (duration: string) => {
    const url = new URL('pearson-correlation', API_URL);
    url.searchParams.set('duration', duration);

    const data = (await api.get(url).json()) as BetaHeatmapResponseType;
    return data;
};

const useBetaHeatmapData = (duration: string) => {
    return useQuery({
        queryKey: ['beta-heatmap-data', duration],
        queryFn: () => fetchBetaHeatmapData(duration),
        cacheTime: 120_000,
        refetchInterval: 120_000,
        staleTime: 120_000,
        refetchOnWindowFocus: false,
    });
};

const fetchZScoreMatrix = async (xAxis: string, yAxis: string, duration: string) => {
    const url = new URL('z-score-matrix', API_URL);
    url.searchParams.set('duration', duration);
    url.searchParams.set('x_axis', xAxis);
    url.searchParams.set('y_axis', yAxis);

    const data = (await api.get(url).json()) as ZScoreMatrixResponseType[];
    return data;
};

const useZScoreMatrix = (xAxis: string, yAxis: string, duration: string) => {
    return useQuery({
        queryKey: ['z-score-matrix', xAxis, yAxis, duration],
        queryFn: () => fetchZScoreMatrix(xAxis, yAxis, duration),
        cacheTime: 120_000,
        refetchInterval: 120_000,
        staleTime: 120_000,
        refetchOnWindowFocus: false,
    });
};

const fetchZScoreHistory = async (type: string, duration: string) => {
    const url = new URL('z-score-history', API_URL);
    url.searchParams.set('duration', duration);
    url.searchParams.set('type', type);

    const data = (await api.get(url).json()) as ZScoreHistoryResponseType;
    return data;
};

const useZScoreHistory = (type: string, duration: string) => {
    return useQuery({
        queryKey: ['z-score-history', type, duration],
        queryFn: () => fetchZScoreHistory(type, duration),
        cacheTime: 120_000,
        refetchInterval: 120_000,
        staleTime: 120_000,
        refetchOnWindowFocus: false,
    });
};

const fetchStatsSelectOptions = async () => {
    const url = new URL(`stats-select-options`, API_URL);

    const data = (await api.get(url).json()) as SelectOptionsResponseType;
    return data;
};

const useStatsSelectOptions = () => {
    return useQuery({
        queryKey: ['stats-select-options'],
        queryFn: () => fetchStatsSelectOptions(),
        cacheTime: 60 * 60 * 1000,
        refetchInterval: 60 * 60 * 1000,
        staleTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export {
    useBetaHeatmapData,
    useFetchTickersOptions,
    usePearsonCorrelation,
    usePriceChangePercentage,
    useStatsSelectOptions,
    useZScoreHistory,
    useZScoreMatrix,
};
