import {createRootRoute, Outlet} from '@tanstack/react-router';

import Navigation from '@/components/Layouts/Navigation';

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
