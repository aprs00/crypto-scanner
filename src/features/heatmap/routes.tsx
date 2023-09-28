import {Route} from '@tanstack/react-router';
import {indexRoute} from '@/lib/router';

import Heatmap from './views/Heatmap';

export const heatmapRoute = new Route({
    getParentRoute: () => indexRoute,
    path: 'heatmap',
    onLoad: async () => {
        return {};
    },
    component: () => <Heatmap />,
});
