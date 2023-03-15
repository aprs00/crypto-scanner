import {Link, Outlet} from '@tanstack/react-router';

const Home = () => {
    return (
        <>
            <div className="py-2 flex gap-2 text-lg mb-4">
                <Link
                    to="/"
                    activeProps={{
                        className: 'font-bold',
                    }}
                    activeOptions={{exact: true}}
                >
                    Home
                </Link>{' '}
                <Link
                    to="/order-book"
                    activeProps={{
                        className: 'font-bold',
                    }}
                >
                    Orderbook
                </Link>{' '}
                <Link
                    to="/beta"
                    activeProps={{
                        className: 'font-bold',
                    }}
                >
                    Beta
                </Link>
            </div>
            <Outlet />
        </>
    );
};

export default Home;
