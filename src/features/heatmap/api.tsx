import {useQuery} from '@tanstack/react-query';

import {api} from '@/lib/ky';

import type {HeatmapResponseType} from './types';

const fetchHeatmapData = async () => {
    const url = new URL('api/v3/global/tree_map_chart_data', 'https://api.coingecko.com');

    const data = (await api.get(url).json()) as HeatmapResponseType[];
    return data;
};

const useHeatmapData = () => {
    return useQuery({
        queryKey: ['heatmap-data'],
        queryFn: () => fetchHeatmapData(),
        staleTime: 30 * 1000,
        cacheTime: 30 * 1000,
    });
};

export {fetchHeatmapData, useHeatmapData};
