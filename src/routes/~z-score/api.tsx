import {useQuery} from '@tanstack/react-query';

import {API_URL} from '@/config/env';
import {api} from '@/lib/ky';

import type {ZScoreMatrixResponseType} from './types';

const fetchZScoreMatrixLarge = async (xAxis: string, yAxis: string, tf: string) => {
    const url = new URL('z-score-matrix-large', API_URL);
    url.searchParams.set('tf', tf);
    url.searchParams.set('x_axis', xAxis);
    url.searchParams.set('y_axis', yAxis);

    return (await api.get(url).json()) as ZScoreMatrixResponseType[];
};

const useZScoreMatrixLarge = (xAxis: string, yAxis: string, tf: string) => {
    return useQuery({
        gcTime: 120_000,
        queryFn: () => fetchZScoreMatrixLarge(xAxis, yAxis, tf),
        queryKey: ['z-score-matrix-large', xAxis, yAxis, tf],
        refetchInterval: 120_000,
        refetchOnWindowFocus: false,
        staleTime: 120_000,
    });
};

export {useZScoreMatrixLarge};
