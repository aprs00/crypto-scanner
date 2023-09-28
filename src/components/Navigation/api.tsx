//
// THIS API IS CURRENTLY NOT USED
//
import {useQuery} from '@tanstack/react-query';

import {api} from '@/lib/ky';
import {API_URL} from '@/config/env';
import type {SelectOptionType} from './types';

const fetchTickersOptions = async () => {
    const url = new URL('tickers-options', API_URL);
    const data = (await api.get(url).json()) as SelectOptionType[];
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
