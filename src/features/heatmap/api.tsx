import ky from 'ky';
import {useQuery} from '@tanstack/react-query';

import type {HeatmapResponseType} from './types';

const fetchHeatmapData = async () => {
    const url = new URL('api/v3/global/tree_map_chart_data', 'https://api.coingecko.com');

    const data = (await ky.get(url).json()) as HeatmapResponseType[];
    return data;
};

const useHeatmapData = () => {
    return useQuery({
        queryKey: ['heatmap-data'],
        queryFn: () => fetchHeatmapData(),
        staleTime: 180 * 1000,
    });
};

export {useHeatmapData};
