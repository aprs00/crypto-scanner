import {Route} from '@tanstack/react-router';
import {homeRoute} from '@/features/home/routes';
import Beta from '../views/Beta';

export const betaRoute = new Route({
    getParentRoute: () => homeRoute,
    path: 'beta',
    onLoad: async () => {
        return {};
    },
    component: () => <Beta />,
});
