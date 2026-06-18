import type { ErrorComponentProps } from '@tanstack/react-router';

import { ErrorComponent, Link, useRouter } from '@tanstack/react-router';

import styles from './DefaultCatchBoundary.module.css';

const DefaultCatchBoundary = ({ error }: ErrorComponentProps) => {
    const router = useRouter();

    const handleRetry = () => {
        void router.invalidate();
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.label}>RUNTIME ERROR</div>
            <ErrorComponent error={error} />
            <div className={styles.actions}>
                <button className="btn" onClick={handleRetry} type="button">
                    RETRY
                </button>
                <Link className="btn" to="/">
                    HOME
                </Link>
            </div>
        </div>
    );
};

export default DefaultCatchBoundary;
