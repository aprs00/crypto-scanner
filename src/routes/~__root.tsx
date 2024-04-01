import {createRootRoute, Outlet} from '@tanstack/react-router';
import {TanStackRouterDevtools} from '@tanstack/router-devtools';

import Navigation from '@/components/Navigation';

export const Route = createRootRoute({
    component: () => (
        <>
            <Navigation />
            <Outlet />
            <TanStackRouterDevtools />
        </>
    ),
});
