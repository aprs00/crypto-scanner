import {lazy, Route} from '@tanstack/react-router';
import {indexRoute} from '@/lib/router';

const Heatmap = lazy(() => import('.'));

export const heatmapRoute = new Route({
    getParentRoute: () => indexRoute,
    path: 'heatmap',
    onLoad: async () => {
        return {};
    },
    component: () => <Heatmap />,
});
