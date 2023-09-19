import ky from 'ky';
import {useQueries, useQuery} from '@tanstack/react-query';

import type {
    KlinesResponseType,
    BetaHeatmapResponseType,
    PriceChangePerDayOfWeekResponseType,
    SelectOptionsResponseType,
    SelectOptionType,
} from './types';
import {API_URL} from '@/config/env';

const fetchPriceChangePerDayOfWeekData = async (symbol: string, duration: string) => {
    const data = (await ky
        .get(`${API_URL}/average-price/${symbol}/${duration}`)
        .json()) as PriceChangePerDayOfWeekResponseType;
    return data;
};

const usePriceChangePerDayOfWeek = (symbol: string, duration: string) => {
    return useQuery({
        queryKey: ['price-change-per-day-of-week', duration, symbol],
        queryFn: () => fetchPriceChangePerDayOfWeekData(symbol, duration),
        cacheTime: 120_000,
        refetchInterval: 120_000,
        staleTime: 120_000,
        refetchOnWindowFocus: false,
    });
};

const fetchTickersOptions = async () => {
    const data = (await ky.get(`${API_URL}/tickers-options`).json()) as SelectOptionType[];
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
    const data = (await ky.get(`${API_URL}/pearson-correlation/${duration}`).json()) as BetaHeatmapResponseType;
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

const fetchStatsSelectOptions = async () => {
    const data = (await ky.get(`${API_URL}/stats-select-options`).json()) as SelectOptionsResponseType;
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

const fetchKlines = async (symbol: string, interval = '1m', limit = 500) => {
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

export {useKlines, useBetaHeatmapData, usePriceChangePerDayOfWeek, useStatsSelectOptions, useFetchTickersOptions};
