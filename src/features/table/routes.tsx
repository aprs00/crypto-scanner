import {lazy, Route} from '@tanstack/react-router';

import {indexRoute} from '@/lib/router';

const Table = lazy(() => import('.'));

const tableRoute = new Route({
    getParentRoute: () => indexRoute,
    path: 'table',
    onLoad: async () => {
        return {};
    },
    component: () => <Table />,
});

export {tableRoute};
