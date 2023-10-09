import {ReactRouter, RootRoute, Outlet} from '@tanstack/react-router';

import Navigation from '@/components/Navigation';

import {orderBookRoute} from '@/features/orderBook/routes';
import {statsRoute} from '@/features/stats/routes';
import {tableRoute} from '@/features/table/routes';
import {heatmapRoute} from '@/features/heatmap/routes';

const indexRoute = new RootRoute({
    component: () => {
        return (
            <>
                <Navigation />
                <Outlet />
            </>
        );
    },
});

const routeTree = indexRoute.addChildren([statsRoute, orderBookRoute, tableRoute, heatmapRoute]);

const router = new ReactRouter({
    routeTree,
    defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
    interface RegisterRouter {
        router: typeof router;
    }
}

export {router, indexRoute};
