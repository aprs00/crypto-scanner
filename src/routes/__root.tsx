import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import CSToastContainer from '@/components/UI/CSToast';
import indexCss from '@/index.css?url';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    head: () => ({
        meta: [
            { charSet: 'UTF-8' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
            {
                name: 'description',
                content: 'Explore cryptocurrency charts and statistics for informed decision-making.',
            },
            { name: 'keywords', content: 'crypto, cryptocurrency, charts, stats, bitcoin, ethereum, blockchain' },
            { name: 'msapplication-TileColor', content: '#da532c' },
            { name: 'theme-color', content: '#ffffff' },
            { title: 'crypto-scanner' },
        ],
        links: [
            { rel: 'stylesheet', href: indexCss },
            { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
            { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
            { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
            { rel: 'manifest', href: '/site.webmanifest' },
            { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#5bbad5' },
        ],
    }),
    component: RootComponent,
});

function RootComponent() {
    return (
        <RootDocument>
            <BaseLayout />
        </RootDocument>
    );
}

function BaseLayout() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col flex-1 min-h-0">
                <Outlet />
            </div>
            <CSToastContainer />
        </div>
    );
}

function RootDocument({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                {import.meta.env.DEV && (
                    <>
                        <TanStackRouterDevtools position="bottom-right" />
                        <ReactQueryDevtools buttonPosition="bottom-left" />
                    </>
                )}
                <Scripts />
            </body>
        </html>
    );
}
