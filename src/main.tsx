import './index.css';

import {QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {createRouter, RouterProvider} from '@tanstack/react-router';
import {inject} from '@vercel/analytics';
import {StrictMode} from 'react';
import ReactDOM from 'react-dom/client';

import {queryClient} from '@/lib/react-query';

import {routeTree} from './routeTree.gen';

const router = createRouter({routeTree});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

const rootElement = document.getElementById('root');

if (!rootElement?.innerHTML) {
    const root = ReactDOM.createRoot(rootElement as HTMLElement);

    inject();

    root.render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <ReactQueryDevtools />
            </QueryClientProvider>
        </StrictMode>,
    );
} else {
    console.error('Root element is not empty.');
}
