import { coingeckoInstance } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

import type { HeatmapResponseType } from './types';

const useHeatmapData = () =>
    useQuery({
        gcTime: 30_000,
        queryFn: async () =>
            (await coingeckoInstance.get<HeatmapResponseType[]>('api/v3/global/tree_map_chart_data')).data,
        queryKey: ['heatmap-data'],
        staleTime: 30_000,
    });

export { useHeatmapData };
