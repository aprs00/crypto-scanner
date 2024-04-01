import {useQuery} from '@tanstack/react-query';

import {api} from '@/lib/ky';

import type {HeatmapResponseType} from './types';

const fetchHeatmapData = async () => {
    const url = new URL('api/v3/global/tree_map_chart_data', 'https://api.coingecko.com');

    return (await api.get(url).json()) as HeatmapResponseType[];
};

const useHeatmapData = () => {
    return useQuery({
        gcTime: 30 * 1000,
        queryFn: () => fetchHeatmapData(),
        queryKey: ['heatmap-data'],
        staleTime: 30 * 1000,
    });
};

export {fetchHeatmapData, useHeatmapData};
