import CSButton, { CSButtonAs } from '@/components/UI/CSButton';

import styles from './NotFound.module.css';

const NotFound = () => {
    return (
        <div className={styles.wrap}>
            <div className={styles.code}>404 — NOT FOUND</div>
            <CSButton as={CSButtonAs.Link} to="/">
                RETURN TO TERMINAL
            </CSButton>
        </div>
    );
};

export default NotFound;
