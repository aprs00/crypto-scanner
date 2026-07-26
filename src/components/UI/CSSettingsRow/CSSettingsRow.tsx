import type { ReactNode } from 'react';

import styles from './CSSettingsRow.module.css';

type Props = {
    children: ReactNode;
    htmlFor?: string;
    label: ReactNode;
};

const CSSettingsRow = ({ children, htmlFor, label }: Props) => (
    <div className={styles.root}>
        {(htmlFor && (
            <label className={styles.label} htmlFor={htmlFor}>
                {label}
            </label>
        )) || <span className={styles.label}>{label}</span>}
        {children}
    </div>
);

export default CSSettingsRow;
