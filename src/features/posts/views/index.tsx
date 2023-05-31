import {Route} from '@tanstack/react-router';

import {homeRoute} from '@/features/home/routes';

const indexRoute = new Route({
    getParentRoute: () => homeRoute,
    path: '/home',
    component: () => {
        return (
            <div className="p-2">
                <h3>Welcome Home!</h3>
            </div>
        );
    },
});

export {indexRoute};
