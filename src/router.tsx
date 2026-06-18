import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import CSSpinner from '@/components/UI/CSSpinner';
import DefaultCatchBoundary from '@/components/UI/DefaultCatchBoundary';
import NotFound from '@/components/UI/NotFound';

import { routeTree } from './routeTree.gen';

export function getRouter() {
    // A fresh QueryClient per request keeps SSR/prerender safe.
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30_000,
            },
        },
    });

    const router = createRouter({
        routeTree,
        context: { queryClient },
        defaultPreload: 'intent',
        defaultPendingComponent: CSSpinner,
        defaultErrorComponent: DefaultCatchBoundary,
        defaultNotFoundComponent: () => <NotFound />,
        scrollRestoration: true,
    });

    setupRouterSsrQueryIntegration({ router, queryClient });

    return router;
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
