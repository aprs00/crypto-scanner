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
        gcTime: 20_000,
        queryFn: () => fetchCorrelations(tf, type),
        queryKey: ['correlation', tf, type],
        refetchInterval: 20_000,
        staleTime: 20_000,
    });
};

const fetchCorrelationsTimeframeOptions = async () => {
    const url = new URL(`pearson-time-frame-options`, env.baseAPI);

    return (await api.get(url).json()) as SelectOption[];
};

const useCorrelationsTimeframeOptions = () => {
    return useQuery({
        queryFn: () => fetchCorrelationsTimeframeOptions(),
        queryKey: ['correlations-time-frame-options'],
        staleTime: Infinity,
    });
};

const fetchCorrelationsTypeOptions = async () => {
    const url = new URL(`pearson-type-options`, env.baseAPI);

    return (await api.get(url).json()) as SelectOption[];
};

const useCorrelationTypeOptions = () => {
    return useQuery({
        queryFn: () => fetchCorrelationsTypeOptions(),
        queryKey: ['correlation-type-options'],
        staleTime: Infinity,
    });
};

export {useCorrelations, useCorrelationsTimeframeOptions, useCorrelationTypeOptions};
