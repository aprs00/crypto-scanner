import {useQuery} from '@tanstack/react-query';

import api from '@/lib/api';

import type {HeatmapResponseType} from './types';

const fetchHeatmapData = async () => {
    const url = 'api/v3/global/tree_map_chart_data';

    return await api.get<HeatmapResponseType>(url);
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
