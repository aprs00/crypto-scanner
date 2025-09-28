import { createRootRoute, Outlet } from '@tanstack/react-router';

import CSNavigation from '../components/Layouts/CSNavigation';
import useServerNotifications from '../hooks/useServerNotifications';

export const Route = createRootRoute({
    component: BaseLayout,
});

function BaseLayout() {
    useServerNotifications({
        debounceMs: 1000,
        maxReconnectAttempts: 20,
    });

    return (
        <>
            <CSNavigation />
            <Outlet />
        </>
    );
}
