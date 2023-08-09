import {lazy, Route} from '@tanstack/react-router';

import {homeRoute} from '@/features/home/routes';
import {queryClient} from '@/lib/react-query';
import {fetchKlines} from './api';

const Beta = lazy(() => import('./views/Stats'));

const betaTickersList = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'];

export const statsRoute = new Route({
    getParentRoute: () => homeRoute,
    path: 'stats',
    onLoad: async () => {
        // queryClient.getQueriesData({queryKey: ['kline']}).length ||
        //     betaTickersList.map((ticker) =>
        //         queryClient.prefetchQuery({
        //             queryKey: ['kline', ticker],
        //             queryFn: () => fetchKlines(ticker),
        //         }),
        //     );

        // return {};
    },
    component: () => <Beta />,
});
