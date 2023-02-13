import {ReactRouter} from '@tanstack/react-router';

import {homeRoute} from '@/features/home/routes';
import {postRoute} from '@/features/posts/views/post';
import {postsRoute} from '@/features/posts/views/posts';
import {indexRoute} from '@/features/posts/views/index';
import {postsIndexRoute} from '@/features/posts/views/postsIndex';
import {orderBookRoute} from '@/features/orderBook/routes';
import {betaRoute} from '@/features/beta/routes';

const routeTree = homeRoute.addChildren([
    indexRoute,
    orderBookRoute,
    postsRoute.addChildren([postsIndexRoute, postRoute]),
    betaRoute,
]);

const router = new ReactRouter({
    routeTree,
    defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
    interface RegisterRouter {
        router: typeof router;
    }
}

export {router};
