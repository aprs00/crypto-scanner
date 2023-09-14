import ky from 'ky';
import {useQueries, useQuery} from '@tanstack/react-query';

import type {
    KlinesResponseType,
    BetaHeatmapResponseType,
    PriceChangePerDayOfWeekResponseType,
    SelectOptionsResponseType,
} from './types';
import {API_URL} from '@/config/env';

const fetchPriceChangePerDayOfWeekData = async (duration: string): Promise<PriceChangePerDayOfWeekResponseType> => {
    const data = (await ky
        .get(`${API_URL}/average-price/BTCUSDT/${duration}`)
        .json()) as PriceChangePerDayOfWeekResponseType;
    return data;
};

const fetchBetaHeatMapData = async (duration: string): Promise<BetaHeatmapResponseType> => {
    const data = (await ky.get(`${API_URL}/pearson-correlation/${duration}`).json()) as BetaHeatmapResponseType;
    return data;
};

const fetchStatsSelectOptions = async (): Promise<SelectOptionsResponseType[]> => {
    const data = (await ky.get(`${API_URL}/stats-select-options`).json()) as SelectOptionsResponseType[];
    return data;
};

const usePriceChangePerDayOfWeek = (duration: string) => {
    return useQuery({
        queryKey: ['price-change-per-day-of-week', duration],
        queryFn: () => fetchPriceChangePerDayOfWeekData(duration),
        cacheTime: 120_000,
        refetchInterval: 120_000,
        staleTime: 120_000,
        refetchOnWindowFocus: false,
    });
};

const useBetaHeatMapData = (duration: string) => {
    return useQuery({
        queryKey: ['beta-heatmap-data'],
        queryFn: () => fetchBetaHeatMapData(duration),
        cacheTime: 120_000,
        refetchInterval: 120_000,
        staleTime: 120_000,
        refetchOnWindowFocus: false,
    });
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

const fetchKlines = async (symbol: string, interval = '1m', limit = 500): Promise<KlinesResponseType> => {
    const data = (await ky
        .get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
        .json()) as KlinesResponseType;
    return data;
};

const useKlines = (symbols: string[]) =>
    useQueries({
        queries: symbols.map((ticker: string) => ({
            queryKey: ['kline', ticker],
            queryFn: () => fetchKlines(ticker),
            refetchInterval: 120_000,
            cacheTime: 120_000,
            refetchOnWindowFocus: false,
        })),
    });

export {useKlines, useBetaHeatMapData, usePriceChangePerDayOfWeek, useStatsSelectOptions};
