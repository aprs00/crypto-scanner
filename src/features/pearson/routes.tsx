import {lazy, Route} from '@tanstack/react-router';

import {indexRoute} from '@/lib/router';

const Pearson = lazy(() => import('./views/Pearson'));

const pearsonRoute = new Route({
    getParentRoute: () => indexRoute,
    path: 'pearson',
    onLoad: async () => {},
    component: () => <Pearson />,
});

export {pearsonRoute};
