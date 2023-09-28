import ky from 'ky';
import {useQuery} from '@tanstack/react-query';

import type {
    BetaHeatmapResponseType,
    AveragePriceChangeResponseType,
    SelectOptionsResponseType,
    SelectOptionType,
    ZScoreMatrixResponseType,
    ZScoreHistoryResponseType,
} from './types';
import {API_URL} from '@/config/env';

const fetchPriceChangePercentage = async (symbol: string, duration: string, type: string) => {
    const url = new URL(`average-price-${type}/${symbol}/${duration}`, API_URL);

    const data = (await ky.get(url).json()) as AveragePriceChangeResponseType;
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

    const data = (await ky.get(url).json()) as SelectOptionType[];
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

const fetchBetaHeatmapData = async (duration: string) => {
    const url = new URL(`pearson-correlation/${duration}`, API_URL);

    const data = (await ky.get(url).json()) as BetaHeatmapResponseType;
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
    const url = new URL(`z-score-matrix/${duration}`, API_URL);
    url.searchParams.set('x_axis', xAxis);
    url.searchParams.set('y_axis', yAxis);

    const data = (await ky.get(url).json()) as ZScoreMatrixResponseType[];
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
    const url = new URL(`z-score-history/${duration}/${type}`, API_URL);

    const data = (await ky.get(url).json()) as ZScoreHistoryResponseType;
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

    const data = (await ky.get(url).json()) as SelectOptionsResponseType;
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
    usePriceChangePercentage,
    useStatsSelectOptions,
    useFetchTickersOptions,
    useZScoreMatrix,
    useZScoreHistory,
};
