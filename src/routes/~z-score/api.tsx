import type { HeatmapResponse, ZScoreMatrixResponse } from '@/types/api';

import api from '@/lib/api';
import { ZScoreHeatmapParams, ZScoreMatrixLargeParams } from '@/routes/~z-score/types';
import { useQuery } from '@tanstack/react-query';

const fetchZScoreMatrixLarge = async (params: ZScoreMatrixLargeParams) => {
    const { data } = await api.get<ZScoreMatrixResponse[]>('z-score-matrix-large', { params });
    return data;
};

const useZScoreMatrixLarge = (params: ZScoreMatrixLargeParams) => {
    return useQuery({
        gcTime: 20_000,
        queryFn: () => fetchZScoreMatrixLarge(params),
        queryKey: ['z-score-matrix-large', params],
        refetchInterval: 20_000,
        staleTime: 20_000,
    });
};

const fetchZScoreHeatmap = async (params: ZScoreHeatmapParams) => {
    const { data } = await api.get<HeatmapResponse>('z-score-heatmap', { params });
    return data;
};

const useZScoreHeatmap = (params: ZScoreHeatmapParams) => {
    return useQuery({
        gcTime: 60_000,
        queryFn: () => fetchZScoreHeatmap(params),
        queryKey: ['z-score-heatmap', params],
        refetchInterval: 60_000,
        staleTime: 60_000,
    });
};

export { useZScoreHeatmap, useZScoreMatrixLarge };
