import { createRootRoute, Outlet } from '@tanstack/react-router';

import CSNavigation from '../components/Layouts/CSNavigation';
import CSToastContainer from '../components/UI/CSToast';
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
        <div className="flex flex-col h-full">
            <CSNavigation />
            <div className="flex flex-col flex-1 min-h-0">
                <Outlet />
            </div>
            <CSToastContainer />
        </div>
    );
}
