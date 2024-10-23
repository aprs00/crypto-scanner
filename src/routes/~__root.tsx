import {createRootRoute, Outlet} from '@tanstack/react-router';

import CSNavigation from '../components/Layouts/CSNavigation';

export const Route = createRootRoute({
    component: BaseLayout,
});

function BaseLayout() {
    return (
        <>
            <CSNavigation />
            <Outlet />
        </>
    );
}
