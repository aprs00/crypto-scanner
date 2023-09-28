import {Route} from '@tanstack/react-router';

import {indexRoute} from '@/lib/router';

import OrderBook from './views/OrderBook';

export const orderBookRoute = new Route({
    getParentRoute: () => indexRoute,
    path: '/',
    onLoad: async () => {
        return {};
    },
    component: () => <OrderBook />,
});
