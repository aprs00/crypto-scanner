import {Route} from '@tanstack/react-router';
import {postsRoute} from './posts';

const postsIndexRoute = new Route({
    getParentRoute: () => postsRoute,
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
