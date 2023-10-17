import {lazy, Route} from '@tanstack/react-router';
import {indexRoute} from '@/lib/router';

import {queryClient} from '@/lib/react-query';
import {fetchHeatmapData} from './api';

const Heatmap = lazy(() => import('.'));

const heatmapRoute = new Route({
    getParentRoute: () => indexRoute,
    path: 'heatmap',
    onLoad: async () => {
        await queryClient.prefetchQuery({
            queryKey: ['heatmap-data'],
            queryFn: fetchHeatmapData,
            staleTime: 30 * 1000,
            cacheTime: 30 * 1000,
        });
    },
    component: () => <Heatmap />,
});

export {heatmapRoute};
