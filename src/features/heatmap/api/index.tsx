import ky from 'ky';
import {useQuery} from '@tanstack/react-query';

import {HeatmapResponseType} from '../types';

const fetchHeatmapData = async (): Promise<HeatmapResponseType[]> => {
    const data = (await ky
        .get('https://api.coingecko.com/api/v3/global/tree_map_chart_data?vs_currency=usd')
        .json()) as HeatmapResponseType[];
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
