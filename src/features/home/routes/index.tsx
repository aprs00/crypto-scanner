import {createRouteConfig, Link, Outlet} from '@tanstack/react-router';

import Home from '../views/home';

const homeRoute = createRouteConfig({
    component: () => {
        return <Home />;
    },
});

export {homeRoute};
