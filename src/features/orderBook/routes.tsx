import {lazy, Route} from '@tanstack/react-router';

import {indexRoute} from '@/lib/router';

const OrderBook = lazy(() => import('.'));

const orderBookRoute = new Route({
    getParentRoute: () => indexRoute,
    path: '/',
    onLoad: async () => {
        return {};
    },
    component: () => <OrderBook />,
});

export {orderBookRoute};
