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
        queryKey: ['pearson-correlation', tf, type],
        queryFn: () => fetchPearsonCorrelation(tf, type),
        cacheTime: 15_000,
        refetchInterval: 15_000,
        staleTime: 15_000,
        refetchOnWindowFocus: false,
    });
};

const fetchPearsonTimeframeOptions = async () => {
    const url = new URL(`pearson-time-frame-options`, API_URL);

    return (await api.get(url).json()) as SelectOption[];
};

const usePearsonTimeframeOptions = () => {
    return useQuery({
        queryKey: ['pearson-time-frame-options'],
        queryFn: () => fetchPearsonTimeframeOptions(),
        cacheTime: 60 * 60 * 1000,
        refetchInterval: 60 * 60 * 1000,
        staleTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

const fetchPearsonTypeOptions = async () => {
    const url = new URL(`pearson-type-options`, API_URL);

    return (await api.get(url).json()) as SelectOption[];
};

const usePearsonTypeOptions = () => {
    return useQuery({
        queryKey: ['pearson-type-options'],
        queryFn: () => fetchPearsonTypeOptions(),
        cacheTime: 60 * 60 * 1000,
        refetchInterval: 60 * 60 * 1000,
        staleTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export {usePearsonCorrelation, usePearsonTimeframeOptions, usePearsonTypeOptions};
