import { useQuery } from '@tanstack/react-query';

import type { CorrelationHeatmapResponse, GridHeatmapResponse, ZScoreScatterResponse } from '@/types/api';

import api from '@/lib/api';

import {
    AveragePriceChangeParams,
    AveragePriceChangeResponse,
    HeatmapParams,
    ZScoreHistoryParams,
    ZScoreHeatmapParams,
    ZScoreHistoryResponse,
    ZScoreScatterParams,
    BootstrapResponse,
} from './types';

const usePriceChangePercentage = (params: AveragePriceChangeParams) =>
    useQuery({
        gcTime: 120_000,
        queryFn: async () => (await api.get<AveragePriceChangeResponse>('average-prices', { params })).data,
        queryKey: ['average-prices', params],
        refetchInterval: 120_000,
        staleTime: 120_000,
    });

const useBetaHeatmapData = (params: HeatmapParams) =>
    useQuery({
        gcTime: 30_000,
        queryFn: async () => (await api.get<CorrelationHeatmapResponse>('pearson-correlation', { params })).data,
        queryKey: ['pearson-correlation', params],
        refetchInterval: 30_000,
        staleTime: 30_000,
    });

const useZScoreScatter = (params: ZScoreScatterParams) =>
    useQuery({
        gcTime: 30_000,
        queryFn: async () => (await api.get<ZScoreScatterResponse[]>('z-score-matrix', { params })).data,
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

const useBootstrap = () =>
    useQuery({
        queryFn: async () => (await api.get<BootstrapResponse>('bootstrap')).data,
        queryKey: ['bootstrap'],
        staleTime: Infinity,
    });

export {
    useBetaHeatmapData,
    usePriceChangePercentage,
    useZScoreHistory,
    useZScoreHeatmap,
    useZScoreScatter,
    useBootstrap,
};
