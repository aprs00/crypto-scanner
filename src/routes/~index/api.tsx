import { useQuery } from '@tanstack/react-query';

import type { CorrelationHeatmapResponse, GridHeatmapResponse, ZScoreScatterResponse } from '@/types/api';

import api from '@/lib/api';

import {
    AveragePriceChangeParams,
    AveragePriceChangeResponse,
    HeatmapParams,
    ZScoreHeatmapParams,
    ZScoreScatterParams,
    BootstrapResponse,
    CorrelationPairHistoryParams,
    CorrelationPairHistoryResponse,
} from './types';

const usePriceChangePercentage = (params: AveragePriceChangeParams) =>
    useQuery({
        gcTime: 60_000,
        queryFn: async () => (await api.get<AveragePriceChangeResponse>('average-prices', { params })).data,
        queryKey: ['average-prices', params],
        refetchInterval: 60_000,
        staleTime: 60_000,
    });

const useBetaHeatmapData = (params: HeatmapParams) =>
    useQuery({
        queryFn: async () => (await api.get<CorrelationHeatmapResponse>('pearson-correlation', { params })).data,
        queryKey: ['pearson-correlation', params],
    });

const useZScoreScatter = (params: ZScoreScatterParams) =>
    useQuery({
        queryFn: async () => (await api.get<ZScoreScatterResponse[]>('z-score-matrix', { params })).data,
        queryKey: ['z-score-matrix', params],
    });

const useZScoreHeatmap = (params: ZScoreHeatmapParams) =>
    useQuery({
        queryFn: async () => (await api.get<GridHeatmapResponse>('z-score-heatmap', { params })).data,
        queryKey: ['z-score-heatmap', params],
    });

const useBootstrap = () =>
    useQuery({
        queryFn: async () => (await api.get<BootstrapResponse>('bootstrap')).data,
        queryKey: ['bootstrap'],
    });

const useCorrelationPairHistory = (params: CorrelationPairHistoryParams) =>
    useQuery({
        queryFn: async () =>
            (await api.get<CorrelationPairHistoryResponse>('correlation-pair-history', { params })).data,
        queryKey: ['correlation-pair-history', params],
    });

export {
    useBetaHeatmapData,
    usePriceChangePercentage,
    useZScoreHeatmap,
    useZScoreScatter,
    useBootstrap,
    useCorrelationPairHistory,
};
