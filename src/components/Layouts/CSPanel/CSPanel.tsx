import type { ReactNode } from 'react';

import CSButton from '@/components/UI/CSButton';

import styles from './CSPanel.module.css';

type CSPanelProps = {
    children: ReactNode;
    title?: ReactNode;
    controls?: ReactNode;
    className?: string;
    bodyClassName?: string;
    onRemove?: () => void;
    showGrip?: boolean;
};

const CSPanel = ({
    children,
    title,
    controls,
    className = '',
    bodyClassName = '',
    onRemove,
    showGrip = true,
}: CSPanelProps) => {
    return (
        <div className={`${styles.panel} ${className}`.trim()}>
            <div className={styles.head}>
                {showGrip && (
                    <span aria-hidden className={styles.grip} id="drag-handle" title="Drag to reposition">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                    </span>
                )}
                {title && <span className={styles.title}>{title}</span>}
                {(controls || onRemove) && (
                    <span className={`${styles.ctrl} cs-no-drag`}>
                        {controls}
                        {onRemove && (
                            <CSButton ariaLabel="Remove panel" onClick={onRemove} square title="Remove panel">
                                -
                            </CSButton>
                        )}
                    </span>
                )}
            </div>
            <div className={`${styles.body} ${bodyClassName}`.trim()}>{children}</div>
        </div>
    );
};

export default CSPanel;
