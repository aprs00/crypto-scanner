import type { HeatmapResponse, SelectOption } from '@/types/api';

import api from '@/lib/api';
import { CorrelationsParams } from '@/routes/~correlations/types';
import { useQuery } from '@tanstack/react-query';

const fetchCorrelations = async (params: CorrelationsParams) => {
    const { data } = await api.get<HeatmapResponse>('large-pearson-correlation', { params });
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
    const { data } = await api.get<SelectOption[]>('pearson-time-frame-options');
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
    const { data } = await api.get<SelectOption[]>('pearson-type-options');
    return data;
};

const useCorrelationTypeOptions = () => {
    return useQuery({
        queryFn: () => fetchCorrelationsTypeOptions(),
        queryKey: ['correlation-type-options'],
        staleTime: Infinity,
    });
};

export { useCorrelations, useCorrelationsTimeframeOptions, useCorrelationTypeOptions };
