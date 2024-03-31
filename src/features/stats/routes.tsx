import {lazy, Route} from '@tanstack/react-router';

import {indexRoute} from '@/lib/router';

const Stats = lazy(() => import('./views/Stats'));

const statsRoute = new Route({
    getParentRoute: () => indexRoute,
    path: '/',
    onLoad: async () => {},
    component: () => <Stats />,
});

export {statsRoute};
