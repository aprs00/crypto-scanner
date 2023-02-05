import {postsRoute} from './posts';

const postsIndexRoute = postsRoute.createRoute({
    path: '/',
    component: () => {
        return (
            <>
                <div>Select a post.</div>
            </>
        );
    },
});

export {postsIndexRoute};
