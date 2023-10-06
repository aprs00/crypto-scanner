import {memo} from 'react';
import {Link} from '@tanstack/react-router';

import {navigationLinks} from '@/config/links';

const Navigation = () => {
    const links = navigationLinks.map((link) => (
        <Link key={link.path} to={link.path} activeProps={{className: 'font-bold'}}>
            {link.name}
        </Link>
    ));

    return (
        <div className="flex items-center justify-between py-3 mx-3">
            <div className="flex gap-3 text-lg">{links}</div>
        </div>
    );
};

export default memo(Navigation);
