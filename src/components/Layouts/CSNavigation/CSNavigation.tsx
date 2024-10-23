import {Link} from '@tanstack/react-router';

import {headerLinks} from '@/config/links';

const CSNavigation = () => {
    return (
        <div className="flex items-center justify-between p-3">
            <div className="flex gap-3 text-lg overflow-auto text-nowrap">
                {headerLinks.map((link) => (
                    <Link className="[&.active]:font-bold" key={link.path} to={link.path}>
                        {link.label}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CSNavigation;
