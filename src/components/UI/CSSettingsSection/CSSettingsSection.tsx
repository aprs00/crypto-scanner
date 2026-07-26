import type { ReactNode } from 'react';

import styles from './CSSettingsSection.module.css';

type Props = {
    children: ReactNode;
    title?: string;
};

const CSSettingsSection = ({ children, title }: Props) => (
    <section className={styles.root}>
        {title && <h3 className={styles.heading}>{title}</h3>}
        {children}
    </section>
);

export default CSSettingsSection;
