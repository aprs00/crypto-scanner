import { Link } from '@tanstack/react-router';

import styles from './NotFound.module.css';

const NotFound = () => {
    return (
        <div className={styles.wrap}>
            <div className={styles.code}>404 — NOT FOUND</div>
            <Link className="btn" to="/">
                RETURN TO TERMINAL
            </Link>
        </div>
    );
};

export default NotFound;
