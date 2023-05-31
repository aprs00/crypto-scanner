import {Outlet} from '@tanstack/react-router';

import Navigation from '@/components/Navigation';

const Home = () => {
    return (
        <>
            <Navigation />
            <Outlet />
        </>
    );
};

export default Home;
