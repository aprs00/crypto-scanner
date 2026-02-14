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
    HeatmapParams,
    ZScoreHeatmapParams,
    ZScoreScatterParams,
    ZScoreScatter3DParams,
    BootstrapResponse,
    CorrelationPairHistoryParams,
    CorrelationPairHistoryResponse,
    CointegrationPairHistoryParams,
    CointegrationPairHistoryResponse,
    CointegrationLiveTableParams,
    CointegrationLiveTableResponse,
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
        queryFn: async () => (await api.post<ZScoreScatterResponse[]>('z-score-matrix', params)).data,
        queryKey: ['z-score-matrix', params],
    });

const useZScoreScatter3D = (params: ZScoreScatter3DParams) =>
    useQuery({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<ZScoreScatter3DResponse[]>('z-score-matrix', params)).data,
        queryKey: ['z-score-matrix-3d', params],
    });

const useZScoreHeatmap = (params: ZScoreHeatmapParams) =>
    useQuery({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<GridHeatmapResponse>('z-score-heatmap', params)).data,
        queryKey: ['z-score-heatmap', params],
    });

const useBootstrap = () =>
    useQuery({
        queryFn: async () => (await api.get<BootstrapResponse>('bootstrap')).data,
        queryKey: ['bootstrap'],
    });

const useCorrelationPairHistory = (params: CorrelationPairHistoryParams) =>
    useQuery({
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<CorrelationPairHistoryResponse>('correlation-pair-history', params)).data,
        queryKey: ['correlation-pair-history', params],
    });

const useCointegrationPairHistory = (params: CointegrationPairHistoryParams) =>
    useQuery({
        enabled: Boolean(
            params.exchange &&
                params.baseSymbol &&
                params.comparisonSymbols.length > 0 &&
                params.window &&
                params.hours &&
                params.metric,
        ),
        placeholderData: keepPreviousData,
        queryFn: async () =>
            (await api.post<CointegrationPairHistoryResponse>('cointegration-pair-history', params)).data,
        queryKey: ['cointegration-pair-history', params],
        refetchInterval: 60_000,
        staleTime: 60_000,
    });

const useCointegrationLiveTable = (params: CointegrationLiveTableParams) =>
    useQuery({
        gcTime: 60_000,
        placeholderData: keepPreviousData,
        queryFn: async () => (await api.post<CointegrationLiveTableResponse>('cointegration-live-table', params)).data,
        queryKey: ['cointegration-live-table', params],
        refetchInterval: 60_000,
        staleTime: 60_000,
    });

export {
    useBetaHeatmapData,
    usePriceChangePercentage,
    useZScoreHeatmap,
    useZScoreScatter,
    useZScoreScatter3D,
    useBootstrap,
    useCorrelationPairHistory,
    useCointegrationPairHistory,
    useCointegrationLiveTable,
};
