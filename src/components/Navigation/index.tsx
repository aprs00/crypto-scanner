import {Link} from '@tanstack/react-router';

const Navigation = () => {
    return (
        <div className="py-2 flex gap-3 text-lg mx-3">
            <Link
                to="/"
                activeProps={{
                    className: 'font-bold',
                }}
            >
                Orderbook
            </Link>
            <Link
                to="/stats"
                activeProps={{
                    className: 'font-bold',
                }}
            >
                Stats
            </Link>
            <Link
                to="/heatmap"
                activeProps={{
                    className: 'font-bold',
                }}
            >
                Heatmap
            </Link>
        </div>
    );
};

export default Navigation;
