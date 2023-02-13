import {RootRoute} from '@tanstack/react-router';

import Home from '../views/home';

const homeRoute = new RootRoute({
    component: () => {
        return <Home />;
    },
});

export {homeRoute};
