import {lazy, Route} from '@tanstack/react-router';

import {homeRoute} from '@/features/home/routes';

const Beta = lazy(() => import('./views/Stats'));

const betaTickersList = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'];

export const statsRoute = new Route({
    getParentRoute: () => homeRoute,
    path: 'stats',
    onLoad: async () => {},
    component: () => <Beta />,
});
