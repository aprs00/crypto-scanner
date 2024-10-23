import {useQuery} from '@tanstack/react-query';

import env from '@/config/env';
import api from '@/lib/ky';

import type {HeatmapResponseType} from './types';

const fetchHeatmapData = async () => {
    const url = new URL('api/v3/global/tree_map_chart_data', env.coingeckoAPI);

    return (await api.get(url).json()) as HeatmapResponseType[];
};

const useHeatmapData = () => {
    return useQuery({
        gcTime: 30_000,
        queryFn: () => fetchHeatmapData(),
        queryKey: ['heatmap-data'],
        staleTime: 30_000,
    });
};

export {useHeatmapData};
