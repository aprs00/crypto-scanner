import { queryOptions, useQuery } from '@tanstack/react-query';

import { coingeckoInstance } from '@/lib/api';

import type { HeatmapResponseType } from './types';

const heatmapQueryOptions = () =>
    queryOptions({
        gcTime: 30_000,
        queryFn: async () =>
            (await coingeckoInstance.get<HeatmapResponseType[]>('api/v3/global/tree_map_chart_data')).data,
        queryKey: ['heatmap-data'],
        staleTime: 30_000,
    });

const useHeatmapData = () => useQuery(heatmapQueryOptions());

export { heatmapQueryOptions, useHeatmapData };
