import {useEffect, useMemo, useState} from 'react';

import {useDepthSnapshot, useStreamTicker} from '../api';
import {homeRoute} from '@/features/home/routes';
import OrderBook from '../views/orderBook';

export const orderBookRoute = homeRoute.createRoute({
    path: 'order-book',
    loader: async () => {
        return {};
    },
    component: () => <OrderBook />,
});
