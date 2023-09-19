import ky from 'ky';
import {useQuery} from '@tanstack/react-query';

import type {SelectOptionType} from './types';
import {API_URL} from '@/config/env';

const fetchTickersOptions = async () => {
    const data = (await ky.get(`${API_URL}/tickers-options`).json()) as SelectOptionType[];
    return data;
};

const useFetchTickersOptions = () => {
    return useQuery({
        queryKey: ['ticker-options'],
        queryFn: () => fetchTickersOptions(),
        cacheTime: 60 * 60 * 1000,
        refetchInterval: 60 * 60 * 1000,
        staleTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

export {useFetchTickersOptions};
