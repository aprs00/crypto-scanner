import {useQuery} from '@tanstack/react-query';

import {coingeckoInstance} from '@/lib/api';

import type {HeatmapResponseType} from './types';

const fetchHeatmapData = async () => {
    const url = 'api/v3/global/tree_map_chart_data';

    const {data} = await coingeckoInstance.get<HeatmapResponseType>(url);
    return data;
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
