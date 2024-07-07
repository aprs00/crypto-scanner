import {createRootRoute, Outlet} from '@tanstack/react-router';

import {Navigation} from '@/components/Layouts';

export const Route = createRootRoute({
    component: BaseLayout,
});

function BaseLayout() {
    return (
        <>
            <Navigation />
            <Outlet />
        </>
    );
}
