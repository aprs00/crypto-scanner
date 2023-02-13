import {Link, Outlet} from '@tanstack/react-router';

const Home = () => {
    return (
        <>
            <div className="p-2 flex gap-2 text-lg">
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
                    to="/posts"
                    activeProps={{
                        className: 'font-bold',
                    }}
                >
                    Posts
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
            <hr />
            <Outlet />
        </>
    );
};

export default Home;
