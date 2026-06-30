import type { ErrorComponentProps } from '@tanstack/react-router';

import { ErrorComponent, useRouter } from '@tanstack/react-router';

import CSButton, { CSButtonAs } from '@/components/UI/CSButton';

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
                <CSButton onClick={handleRetry}>RETRY</CSButton>
                <CSButton as={CSButtonAs.Link} to="/">
                    HOME
                </CSButton>
            </div>
        </div>
    );
};

export default DefaultCatchBoundary;
