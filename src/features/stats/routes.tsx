import {lazy, Route} from '@tanstack/react-router';

import {indexRoute} from '@/lib/router';

const Stats = lazy(() => import('./views/Stats'));
const Pearson = lazy(() => import('./views/Pearson'));

const statsRoute = new Route({
    getParentRoute: () => indexRoute,
    path: '/',
    onLoad: async () => {},
    component: () => <Stats />,
});

const pearsonRoute = new Route({
    getParentRoute: () => indexRoute,
    path: 'pearson',
    onLoad: async () => {},
    component: () => <Pearson />,
});

export {pearsonRoute, statsRoute};
