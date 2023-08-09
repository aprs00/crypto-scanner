import {ReactRouter} from '@tanstack/react-router';

import {homeRoute} from '@/features/home/routes';
import {indexRoute} from '@/features/posts/views/index';
import {orderBookRoute} from '@/features/orderBook/routes';
import {heatmapRoute} from '@/features/heatmap/routes';
import {statsRoute} from '@/features/stats/routes';

const routeTree = homeRoute.addChildren([indexRoute, orderBookRoute, heatmapRoute, statsRoute]);

const router = new ReactRouter({
    routeTree,
    defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
    interface RegisterRouter {
        router: typeof router;
    }
}

export {router};
