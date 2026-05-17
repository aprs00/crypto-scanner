import type { ReactNode } from 'react';

import styles from './CSPanel.module.css';

export type CSPanelProps = {
    children: ReactNode;
    title?: ReactNode;
    controls?: ReactNode;
    className?: string;
    bodyClassName?: string;
    showGrip?: boolean;
};

const CSPanel = ({ children, title, controls, className = '', bodyClassName = '', showGrip = true }: CSPanelProps) => {
    return (
        <div className={`${styles.panel} ${className}`.trim()}>
            <div className={styles.head}>
                {showGrip && (
                    <span className={styles.grip} id="drag-handle">
                        <i />
                        <i />
                        <i />
                    </span>
                )}
                {title && <span className={styles.title}>{title}</span>}
                {controls && <span className={styles.ctrl}>{controls}</span>}
            </div>
            <div className={`${styles.body} ${bodyClassName}`.trim()}>{children}</div>
        </div>
    );
};

export default CSPanel;
