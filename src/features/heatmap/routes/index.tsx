import {Route} from '@tanstack/react-router';
import {homeRoute} from '@/features/home/routes';

import Heatmap from '../views/Heatmap';

export const heatmapRoute = new Route({
    getParentRoute: () => homeRoute,
    path: 'heatmap',
    onLoad: async () => {
        return {};
    },
    component: () => <Heatmap />,
});
