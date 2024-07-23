import {useQuery} from '@tanstack/react-query';

import {API_URL} from '@/config/env';
import {api} from '@/lib/ky';

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

const fetchZScoreHeatmap = async () => {
    console.log('FETCH Z SCORE HEATMAP');
    const url = new URL('z-score-heatmap', API_URL);

    return (await api.get(url).json()) as any;
};

const useZScoreHeatmap = () => {
    return useQuery({
        gcTime: 60_000,
        queryFn: () => fetchZScoreHeatmap(),
        queryKey: ['z-score-heatmap'],
        refetchInterval: 60_000,
        refetchOnWindowFocus: false,
    });
};

export {useZScoreHeatmap, useZScoreMatrixLarge};
