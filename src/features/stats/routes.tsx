import {lazy, Route} from '@tanstack/react-router';

import {homeRoute} from '@/features/home/routes';

const Beta = lazy(() => import('./views/Stats'));

export const statsRoute = new Route({
    getParentRoute: () => homeRoute,
    path: 'stats',
    onLoad: async () => {},
    component: () => <Beta />,
});
