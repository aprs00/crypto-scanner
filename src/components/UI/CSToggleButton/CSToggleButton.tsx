import type { ReactNode } from 'react';

import styles from './CSToggleButton.module.css';

type Props = {
    active: boolean;
    ariaLabel?: string;
    children: ReactNode;
    onClick: () => void;
    title?: string;
};

const CSToggleButton = ({ active, ariaLabel, children, onClick, title }: Props) => {
    return (
        <button
            aria-label={ariaLabel}
            aria-pressed={active}
            className={`${styles.toggle} ${active ? styles.on : ''}`.trim()}
            onClick={onClick}
            title={title}
            type="button"
        >
            {children}
        </button>
    );
};

export default CSToggleButton;
