import {Outlet, ReactRouter, RootRoute} from '@tanstack/react-router';

import Navigation from '@/components/Navigation';
import {orderBookRoute} from '@/features/chart/routes';
import {heatmapRoute} from '@/features/heatmap/routes';
import {pearsonRoute} from '@/features/pearson/routes';
import {statsRoute} from '@/features/stats/routes';

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

const routeTree = indexRoute.addChildren([statsRoute, pearsonRoute, orderBookRoute, heatmapRoute]);

const router = new ReactRouter({
    routeTree,
    defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
    interface RegisterRouter {
        router: typeof router;
    }
}

export {indexRoute, router};
