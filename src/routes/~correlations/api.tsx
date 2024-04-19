import {useQuery} from '@tanstack/react-query';

import {API_URL} from '@/config/env';
import {api} from '@/lib/ky';

import type {CorrelationsResponse, SelectOption} from './types';

const fetchCorrelations = async (tf: string, type: string) => {
    const url = new URL('large-pearson-correlation', API_URL);
    url.searchParams.set('duration', tf);
    url.searchParams.set('type', type);

    return (await api.get(url).json()) as CorrelationsResponse;
};

const useCorrelations = (tf: string, type: string) => {
    return useQuery({
        gcTime: 10_000,
        queryFn: () => fetchCorrelations(tf, type),
        queryKey: ['correlation', tf, type],
        refetchInterval: 10_000,
        refetchOnWindowFocus: false,
    });
};

const fetchCorrelationsTimeframeOptions = async () => {
    const url = new URL(`pearson-time-frame-options`, API_URL);

    return (await api.get(url).json()) as SelectOption[];
};

const useCorrelationsTimeframeOptions = () => {
    return useQuery({
        gcTime: 60 * 60 * 1000,
        queryFn: () => fetchCorrelationsTimeframeOptions(),
        queryKey: ['correlations-time-frame-options'],
        refetchInterval: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        staleTime: 60 * 60 * 1000,
    });
};

const fetchCorrelationsTypeOptions = async () => {
    const url = new URL(`pearson-type-options`, API_URL);

    return (await api.get(url).json()) as SelectOption[];
};

const useCorrelationTypeOptions = () => {
    return useQuery({
        gcTime: 60 * 60 * 1000,
        queryFn: () => fetchCorrelationsTypeOptions(),
        queryKey: ['correlation-type-options'],
        refetchInterval: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        staleTime: 60 * 60 * 1000,
    });
};

export {useCorrelations, useCorrelationsTimeframeOptions, useCorrelationTypeOptions};
