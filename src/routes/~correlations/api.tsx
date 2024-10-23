import {useQuery} from '@tanstack/react-query';

import env from '@/config/env';
import api from '@/lib/ky';
import type {HeatmapResponse, SelectOption} from '@/types/api';

const fetchCorrelations = async (tf: string, type: string) => {
    const url = new URL('large-pearson-correlation', env.baseAPI);
    url.searchParams.set('duration', tf);
    url.searchParams.set('type', type);

    return (await api.get(url).json()) as HeatmapResponse;
};

const useCorrelations = (tf: string, type: string) => {
    return useQuery({
        gcTime: 7_000,
        queryFn: () => fetchCorrelations(tf, type),
        queryKey: ['correlation', tf, type],
        refetchInterval: 7_000,
    });
};

const fetchCorrelationsTimeframeOptions = async () => {
    const url = new URL(`pearson-time-frame-options`, env.baseAPI);

    return (await api.get(url).json()) as SelectOption[];
};

const useCorrelationsTimeframeOptions = () => {
    return useQuery({
        gcTime: 60 * 60 * 1000,
        queryFn: () => fetchCorrelationsTimeframeOptions(),
        queryKey: ['correlations-time-frame-options'],
        refetchInterval: 60 * 60 * 1000,
        staleTime: 60 * 60 * 1000,
    });
};

const fetchCorrelationsTypeOptions = async () => {
    const url = new URL(`pearson-type-options`, env.baseAPI);

    return (await api.get(url).json()) as SelectOption[];
};

const useCorrelationTypeOptions = () => {
    return useQuery({
        gcTime: 60 * 60 * 1000,
        queryFn: () => fetchCorrelationsTypeOptions(),
        queryKey: ['correlation-type-options'],
        refetchInterval: 60 * 60 * 1000,
        staleTime: 60 * 60 * 1000,
    });
};

export {useCorrelations, useCorrelationsTimeframeOptions, useCorrelationTypeOptions};
