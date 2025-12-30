import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type {
    CorrelationHeatmapResponse,
    GridHeatmapResponse,
    ZScoreScatterResponse,
    ZScoreScatter3DResponse,
} from '@/types/api';

import api from '@/lib/api';

import {
    AveragePriceChangeParams,
    AveragePriceChangeResponse,
    BootstrapParams,
    HeatmapParams,
    ZScoreHeatmapParams,
    ZScoreScatterParams,
    ZScoreScatter3DParams,
    BootstrapResponse,
    CorrelationPairHistoryParams,
    CorrelationPairHistoryResponse,
} from './types';

const usePriceChangePercentage = (params: AveragePriceChangeParams) =>
    useQuery({
        gcTime: 60_000,
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.get<AveragePriceChangeResponse>('average-prices', { params })).data,
        queryKey: ['average-prices', params],
        refetchInterval: 60_000,
        staleTime: 60_000,
    });

const useBetaHeatmapData = (params: HeatmapParams) =>
    useQuery({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<CorrelationHeatmapResponse>('pearson-correlation', params)).data,
        queryKey: ['pearson-correlation', params],
    });

const useZScoreScatter = (params: ZScoreScatterParams) =>
    useQuery({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.get<ZScoreScatterResponse[]>('z-score-matrix', { params })).data,
        queryKey: ['z-score-matrix', params],
    });

const useZScoreScatter3D = (params: ZScoreScatter3DParams) =>
    useQuery({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.get<ZScoreScatter3DResponse[]>('z-score-matrix', { params })).data,
        queryKey: ['z-score-matrix-3d', params],
    });

const useZScoreHeatmap = (params: ZScoreHeatmapParams) =>
    useQuery({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<GridHeatmapResponse>('z-score-heatmap', params)).data,
        queryKey: ['z-score-heatmap', params],
    });

const useBootstrap = (params: BootstrapParams) =>
    useQuery({
        queryFn: async () => (await api.get<BootstrapResponse>('bootstrap', { params })).data,
        queryKey: ['bootstrap', params],
    });

const useCorrelationPairHistory = (params: CorrelationPairHistoryParams) =>
    useQuery({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<CorrelationPairHistoryResponse>('correlation-pair-history', params)).data,
        queryKey: ['correlation-pair-history', params],
    });

export {
    useBetaHeatmapData,
    usePriceChangePercentage,
    useZScoreHeatmap,
    useZScoreScatter,
    useZScoreScatter3D,
    useBootstrap,
    useCorrelationPairHistory,
};
