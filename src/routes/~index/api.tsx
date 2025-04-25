import type { HeatmapResponse, SelectOption, ZScoreMatrixResponse } from '@/types/api';

import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

import {
    AveragePriceChangeParams,
    AveragePriceChangeResponse,
    HeatmapParams,
    SelectOptionsResponse,
    ZScoreHistoryParams,
    ZScoreHistoryResponse,
    ZScoreMatrixParams,
} from './types';

const fetchPriceChangePercentage = async (params: AveragePriceChangeParams) => {
    const { data } = await api.get<AveragePriceChangeResponse>('average-prices', { params });
    return data;
};

const usePriceChangePercentage = (params: AveragePriceChangeParams) => {
    return useQuery({
        gcTime: 120_000,
        queryFn: () => fetchPriceChangePercentage(params),
        queryKey: ['price-change-percentage', params],
        refetchInterval: 120_000,
        staleTime: 120_000,
    });
};

const fetchTickersOptions = async () => {
    const { data } = await api.get<SelectOption[]>('tickers-options');
    return data;
};

const useFetchTickersOptions = () => {
    return useQuery({
        queryFn: () => fetchTickersOptions(),
        queryKey: ['ticker-options'],
        staleTime: Infinity,
    });
};

const fetchBetaHeatmapData = async (params: HeatmapParams) => {
    const url = 'pearson-correlation';

    const { data } = await api.get<HeatmapResponse>(url, { params });
    return data;
};

const useBetaHeatmapData = (params: HeatmapParams) => {
    return useQuery({
        gcTime: 30_000,
        queryFn: () => fetchBetaHeatmapData(params),
        queryKey: ['beta-heatmap-data', params],
        refetchInterval: 30_000,
        staleTime: 30_000,
    });
};

const fetchZScoreMatrix = async (params: ZScoreMatrixParams) => {
    const url = 'z-score-matrix';

    const { data } = await api.get<ZScoreMatrixResponse[]>(url, { params });
    return data;
};

const useZScoreMatrix = (params: ZScoreMatrixParams) => {
    return useQuery({
        gcTime: 30_000,
        queryFn: () => fetchZScoreMatrix(params),
        queryKey: ['z-score-matrix', params],
        refetchInterval: 30_000,
        staleTime: 30_000,
    });
};

const fetchZScoreHistory = async (params: ZScoreHistoryParams) => {
    const { data } = await api.get<ZScoreHistoryResponse>('z-score-history', { params });
    return data;
};

const useZScoreHistory = (params: ZScoreHistoryParams) => {
    return useQuery({
        gcTime: 30_000,
        queryFn: () => fetchZScoreHistory(params),
        queryKey: ['z-score-history', params],
        refetchInterval: 30_000,
        staleTime: 30_000,
    });
};

const fetchStatsSelectOptions = async () => {
    const { data } = await api.get<SelectOptionsResponse>('stats-select-options');
    return data;
};

const useStatsSelectOptions = () => {
    return useQuery({
        queryFn: () => fetchStatsSelectOptions(),
        queryKey: ['stats-select-options'],
        staleTime: Infinity,
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
