import {useQuery} from '@tanstack/react-query';

import {API_URL} from '@/config/env';
import {api} from '@/lib/ky';
import type {CorrelationsResponse} from '@/routes/~correlations/types';

import type {ZScoreMatrixResponse} from './types';

const fetchZScoreMatrixLarge = async (xAxis: string, yAxis: string, tf: string) => {
    const url = new URL('z-score-matrix-large', API_URL);
    url.searchParams.set('tf', tf);
    url.searchParams.set('x_axis', xAxis);
    url.searchParams.set('y_axis', yAxis);

    return (await api.get(url).json()) as ZScoreMatrixResponse[];
};

const useZScoreMatrixLarge = (xAxis: string, yAxis: string, tf: string) => {
    return useQuery({
        gcTime: 7_000,
        queryFn: () => fetchZScoreMatrixLarge(xAxis, yAxis, tf),
        queryKey: ['z-score-matrix-large', xAxis, yAxis, tf],
        refetchInterval: 7_000,
        refetchOnWindowFocus: false,
    });
};

const fetchZScoreHeatmap = async (type: string) => {
    const url = new URL('z-score-heatmap', API_URL);
    url.searchParams.set('type', type);

    return (await api.get(url).json()) as CorrelationsResponse;
};

const useZScoreHeatmap = (type: string) => {
    return useQuery({
        gcTime: 60_000,
        queryFn: () => fetchZScoreHeatmap(type),
        queryKey: ['z-score-heatmap', type],
        refetchInterval: 60_000,
        refetchOnWindowFocus: false,
    });
};

export {useZScoreHeatmap, useZScoreMatrixLarge};
