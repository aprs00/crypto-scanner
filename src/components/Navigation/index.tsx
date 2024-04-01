import {Link} from '@tanstack/react-router';
import {memo} from 'react';

import {headerLinks} from '@/config/links';

const Navigation = () => {
    return (
        <div className="flex items-center justify-between p-3">
            <div className="flex gap-3 text-lg">
                {headerLinks.map((link) => (
                    <Link key={link.path} to={link.path} className="[&.active]:font-bold">
                        {link.label}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default memo(Navigation);
