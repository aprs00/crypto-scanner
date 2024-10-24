import {useQuery} from '@tanstack/react-query';

import api from '@/lib/api';
import type {HeatmapResponse, SelectOption, ZScoreMatrixResponse} from '@/types/api';

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
    const url = 'average-prices';

    const {data} = await api.get<AveragePriceChangeResponse>(url, {params});
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
    const url = 'tickers-options';

    const {data} = await api.get<SelectOption[]>(url);
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

    const {data} = await api.get<HeatmapResponse>(url, {params});
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

    const {data} = await api.get<ZScoreMatrixResponse[]>(url, {params});
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
    const url = 'z-score-history';

    const {data} = await api.get<ZScoreHistoryResponse>(url, {params});
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
    const url = 'stats-select-options';

    const {data} = await api.get<SelectOptionsResponse>(url);
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
