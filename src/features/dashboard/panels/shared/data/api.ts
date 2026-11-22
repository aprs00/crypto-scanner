import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';

import api from '@/lib/api';

import {
    AveragePriceChangeParams,
    AveragePriceChangeResponse,
    BootstrapResponse,
    CorrelationHeatmapResponse,
    CorrelationPairHistoryParams,
    CorrelationPairHistoryResponse,
    GridHeatmapResponse,
    HeatmapParams,
    ZScoreScatter3DResponse,
    ZScoreHeatmapParams,
    ZScoreScatterResponse,
    ZScoreScatterParams,
    ZScoreScatter3DParams,
} from './types';

const priceChangePercentageQueryOptions = (params: AveragePriceChangeParams) =>
    queryOptions({
        gcTime: 60_000,
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.get<AveragePriceChangeResponse>('average-prices', { params })).data,
        queryKey: ['average-prices', params],
        refetchInterval: 60_000,
        staleTime: 60_000,
    });

const betaHeatmapQueryOptions = (params: HeatmapParams) =>
    queryOptions({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<CorrelationHeatmapResponse>('pearson-correlation', params)).data,
        queryKey: ['pearson-correlation', params],
    });

const zScoreScatterQueryOptions = (params: ZScoreScatterParams) =>
    queryOptions({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<ZScoreScatterResponse[]>('z-score-matrix', params)).data,
        queryKey: ['z-score-matrix', params],
    });

const zScoreScatter3DQueryOptions = (params: ZScoreScatter3DParams) =>
    queryOptions({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<ZScoreScatter3DResponse[]>('z-score-matrix', params)).data,
        queryKey: ['z-score-matrix-3d', params],
    });

const zScoreHeatmapQueryOptions = (params: ZScoreHeatmapParams) =>
    queryOptions({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<GridHeatmapResponse>('z-score-heatmap', params)).data,
        queryKey: ['z-score-heatmap', params],
    });

const bootstrapQueryOptions = () =>
    queryOptions({
        queryFn: async () => (await api.get<BootstrapResponse>('bootstrap')).data,
        queryKey: ['bootstrap'],
    });

const correlationPairHistoryQueryOptions = (params: CorrelationPairHistoryParams) =>
    queryOptions({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<CorrelationPairHistoryResponse>('correlation-pair-history', params)).data,
        queryKey: ['correlation-pair-history', params],
    });

const usePriceChangePercentage = (params: AveragePriceChangeParams) =>
    useQuery(priceChangePercentageQueryOptions(params));

const useBetaHeatmapData = (params: HeatmapParams) => useQuery(betaHeatmapQueryOptions(params));

const useZScoreScatter = (params: ZScoreScatterParams) => useQuery(zScoreScatterQueryOptions(params));

const useZScoreScatter3D = (params: ZScoreScatter3DParams) => useQuery(zScoreScatter3DQueryOptions(params));

const useZScoreHeatmap = (params: ZScoreHeatmapParams) => useQuery(zScoreHeatmapQueryOptions(params));

const useBootstrap = () => useQuery(bootstrapQueryOptions());

const useCorrelationPairHistory = (params: CorrelationPairHistoryParams) =>
    useQuery(correlationPairHistoryQueryOptions(params));

export {
    useBetaHeatmapData,
    useBootstrap,
    useCorrelationPairHistory,
    usePriceChangePercentage,
    useZScoreHeatmap,
    useZScoreScatter,
    useZScoreScatter3D,
};
