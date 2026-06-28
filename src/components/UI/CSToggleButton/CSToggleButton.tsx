import type { ReactNode } from 'react';

import styles from './CSToggleButton.module.css';

type Props = { active: boolean; onClick: () => void; children: ReactNode };

const CSToggleButton = ({ active, onClick, children }: Props) => {
    return (
        <button className={`${styles.toggle} ${active ? styles.on : ''}`.trim()} onClick={onClick} type="button">
            {children}
        </button>
    );
};

export default CSToggleButton;
