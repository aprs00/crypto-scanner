import {Route} from '@tanstack/react-router';
import {homeRoute} from '@/features/home/routes';

import OrderBook from './views/OrderBook';

export const orderBookRoute = new Route({
    getParentRoute: () => homeRoute,
    path: '/',
    onLoad: async () => {
        return {};
    },
    component: () => <OrderBook />,
});