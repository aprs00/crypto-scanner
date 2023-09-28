import {lazy, Route} from '@tanstack/react-router';

import {indexRoute} from '@/lib/router';

const Beta = lazy(() => import('./views/Stats'));

export const statsRoute = new Route({
    getParentRoute: () => indexRoute,
    path: 'stats',
    onLoad: async () => {},
    component: () => <Beta />,
});
