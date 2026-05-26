import type { ReactNode } from 'react';

import styles from './CSSegmented.module.css';

export type CSSegmentedProps<T> = {
    options: readonly T[];
    value: T;
    onChange: (value: T) => void;
    renderLabel?: (value: T) => ReactNode;
    className?: string;
    size?: 'sm' | 'md';
};

const CSSegmented = <T extends string | number>({
    options,
    value,
    onChange,
    renderLabel,
    className = '',
    size = 'sm',
}: CSSegmentedProps<T>) => {
    return (
        <span className={[styles.group, className].filter(Boolean).join(' ')}>
            {options.map((opt) => {
                const isActive = opt === value;
                return (
                    <button
                        className={[styles.btn, size === 'md' && styles.btnMd, isActive && styles.active]
                            .filter(Boolean)
                            .join(' ')}
                        key={String(opt)}
                        onClick={() => !isActive && onChange(opt)}
                        type="button"
                    >
                        {renderLabel ? renderLabel(opt) : String(opt)}
                    </button>
                );
            })}
        </span>
    );
};

export default CSSegmented;
