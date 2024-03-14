import {Link} from '@tanstack/react-router';
import {memo} from 'react';

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
                    to="/pearson"
                    activeProps={{
                        className: 'font-bold',
                    }}
                >
                    Pearson
                </Link>
                <Link
                    to="/chart"
                    activeProps={{
                        className: 'font-bold',
                    }}
                >
                    Chart
                </Link>
                {/*<Link*/}
                {/*    to="/table"*/}
                {/*    activeProps={{*/}
                {/*        className: 'font-bold',*/}
                {/*    }}*/}
                {/*>*/}
                {/*    Table*/}
                {/*</Link>*/}
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
