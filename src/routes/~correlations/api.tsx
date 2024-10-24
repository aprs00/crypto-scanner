import {useQuery} from '@tanstack/react-query';

import api from '@/lib/api';
import {CorrelationsParams} from '@/routes/~correlations/types';
import type {HeatmapResponse, SelectOption} from '@/types/api';

const fetchCorrelations = async (params: CorrelationsParams) => {
    const url = 'large-pearson-correlation';

    const {data} = await api.get<HeatmapResponse>(url);
    return data;
};

const useCorrelations = (params: CorrelationsParams) => {
    return useQuery({
        gcTime: 20_000,
        queryFn: () => fetchCorrelations(params),
        queryKey: ['correlation', params],
        refetchInterval: 20_000,
        staleTime: 20_000,
    });
};

const fetchCorrelationsTimeframeOptions = async () => {
    const url = 'pearson-time-frame-options';

    const {data} = await api.get<SelectOption[]>(url);
    return data;
};

const useCorrelationsTimeframeOptions = () => {
    return useQuery({
        queryFn: () => fetchCorrelationsTimeframeOptions(),
        queryKey: ['correlations-time-frame-options'],
        staleTime: Infinity,
    });
};

const fetchCorrelationsTypeOptions = async () => {
    const url = 'pearson-type-options';

    const {data} = await api.get<SelectOption[]>(url);
    return data;
};

const useCorrelationTypeOptions = () => {
    return useQuery({
        queryFn: () => fetchCorrelationsTypeOptions(),
        queryKey: ['correlation-type-options'],
        staleTime: Infinity,
    });
};

export {useCorrelations, useCorrelationsTimeframeOptions, useCorrelationTypeOptions};
