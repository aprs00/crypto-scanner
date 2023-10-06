import {memo} from 'react';
import {Link} from '@tanstack/react-router';

// import {navigationLinks} from '@/config/links';

const Navigation = () => {
    return (
        <div className="flex items-center justify-between py-3 mx-3">
            <div className="flex gap-3 text-lg">
                <Link
                    to="/"
                    activeProps={{
                        className: 'font-bold',
                    }}
                >
                    Stats
                </Link>
                <Link
                    to="/chart"
                    activeProps={{
                        className: 'font-bold',
                    }}
                >
                    Chart
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
        </div>
    );
};

export default memo(Navigation);
