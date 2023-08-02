import {lazy, Route} from '@tanstack/react-router';

import {homeRoute} from '@/features/home/routes';
import {queryClient} from '@/lib/react-query';
import {fetchKlines} from './api';

const Beta = lazy(() => import('./views/Beta'));

const betaTickersList = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'];

export const betaRoute = new Route({
    getParentRoute: () => homeRoute,
    path: 'beta',
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
