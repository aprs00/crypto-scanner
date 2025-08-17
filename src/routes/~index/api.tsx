import type { CorrelationHeatmapResponse, GridHeatmapResponse, SelectOption, ZScoreMatrixResponse } from '@/types/api';

import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

import {
    AveragePriceChangeParams,
    AveragePriceChangeResponse,
    HeatmapParams,
    SelectOptionsResponse,
    ZScoreHistoryParams,
    ZScoreHeatmapParams,
    ZScoreHistoryResponse,
    ZScoreMatrixParams,
} from './types';

const usePriceChangePercentage = (params: AveragePriceChangeParams) =>
    useQuery({
        gcTime: 120_000,
        queryFn: async () => (await api.get<AveragePriceChangeResponse>('average-prices', { params })).data,
        queryKey: ['price-change-percentage', params],
        refetchInterval: 120_000,
        staleTime: 120_000,
    });

const useFetchTickersOptions = () =>
    useQuery({
        queryFn: async () => (await api.get<SelectOption[]>('tickers-options')).data,
        queryKey: ['ticker-options'],
        staleTime: Infinity,
    });

const useBetaHeatmapData = (params: HeatmapParams) =>
    useQuery({
        gcTime: 30_000,
        queryFn: async () => (await api.get<CorrelationHeatmapResponse>('pearson-correlation', { params })).data,
        queryKey: ['beta-heatmap-data', params],
        refetchInterval: 30_000,
        staleTime: 30_000,
    });

const useZScoreMatrix = (params: ZScoreMatrixParams) =>
    useQuery({
        gcTime: 30_000,
        queryFn: async () => (await api.get<ZScoreMatrixResponse[]>('z-score-matrix', { params })).data,
        queryKey: ['z-score-matrix', params],
        refetchInterval: 30_000,
        staleTime: 30_000,
    });

const useZScoreHistory = (params: ZScoreHistoryParams) =>
    useQuery({
        gcTime: 30_000,
        queryFn: async () => (await api.get<ZScoreHistoryResponse>('z-score-history', { params })).data,
        queryKey: ['z-score-history', params],
        refetchInterval: 30_000,
        staleTime: 30_000,
    });

const useZScoreHeatmap = (params: ZScoreHeatmapParams) =>
    useQuery({
        gcTime: 60_000,
        queryFn: async () => (await api.get<GridHeatmapResponse>('z-score-heatmap', { params })).data,
        queryKey: ['z-score-heatmap', params],
        refetchInterval: 60_000,
        staleTime: 60_000,
    });

const useStatsSelectOptions = () =>
    useQuery({
        queryFn: async () => (await api.get<SelectOptionsResponse>('stats-select-options')).data,
        queryKey: ['stats-select-options'],
        staleTime: Infinity,
    });

const useCorrelationTypeOptions = () =>
    useQuery({
        queryFn: async () => (await api.get<SelectOption[]>('pearson-type-options')).data,
        queryKey: ['correlation-type-options'],
        staleTime: Infinity,
    });

export {
    useBetaHeatmapData,
    useFetchTickersOptions,
    usePriceChangePercentage,
    useStatsSelectOptions,
    useZScoreHistory,
    useZScoreHeatmap,
    useZScoreMatrix,
    useCorrelationTypeOptions,
};
