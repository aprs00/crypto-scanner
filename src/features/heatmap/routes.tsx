import {lazy, Route} from '@tanstack/react-router';
import {indexRoute} from '@/lib/router';

import {fetchHeatmapData} from './api';

const Heatmap = lazy(() => import('.'));

const heatmapRoute = new Route({
    getParentRoute: () => indexRoute,
    path: 'heatmap',
    onLoad: async () => {
        fetchHeatmapData();
    },
    component: () => <Heatmap />,
});

export {heatmapRoute};
