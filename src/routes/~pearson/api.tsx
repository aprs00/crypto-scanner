import {useQuery} from '@tanstack/react-query';

import {API_URL} from '@/config/env';
import {api} from '@/lib/ky';

import type {PearsonResponse, SelectOption} from './types';

const fetchPearsonCorrelation = async (tf: string, type: string) => {
    const url = new URL('large-pearson-correlation', API_URL);
    url.searchParams.set('duration', tf);
    url.searchParams.set('type', type);

    return (await api.get(url).json()) as PearsonResponse;
};

const usePearsonCorrelation = (tf: string, type: string) => {
    return useQuery({
        gcTime: 15_000,
        queryFn: () => fetchPearsonCorrelation(tf, type),
        queryKey: ['pearson-correlation', tf, type],
        refetchInterval: 15_000,
        refetchOnWindowFocus: false,
        staleTime: 15_000,
    });
};

const fetchPearsonTimeframeOptions = async () => {
    const url = new URL(`pearson-time-frame-options`, API_URL);

    return (await api.get(url).json()) as SelectOption[];
};

const usePearsonTimeframeOptions = () => {
    return useQuery({
        gcTime: 60 * 60 * 1000,
        queryFn: () => fetchPearsonTimeframeOptions(),
        queryKey: ['pearson-time-frame-options'],
        refetchInterval: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        staleTime: 60 * 60 * 1000,
    });
};

const fetchPearsonTypeOptions = async () => {
    const url = new URL(`pearson-type-options`, API_URL);

    return (await api.get(url).json()) as SelectOption[];
};

const usePearsonTypeOptions = () => {
    return useQuery({
        gcTime: 60 * 60 * 1000,
        queryFn: () => fetchPearsonTypeOptions(),
        queryKey: ['pearson-type-options'],
        refetchInterval: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        staleTime: 60 * 60 * 1000,
    });
};

export {usePearsonCorrelation, usePearsonTimeframeOptions, usePearsonTypeOptions};
