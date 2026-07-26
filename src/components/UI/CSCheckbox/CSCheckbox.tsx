import type { ChangeEvent, ReactNode } from 'react';

import styles from './CSCheckbox.module.css';

type Props = {
    checked: boolean;
    label: ReactNode;
    onChange: (checked: boolean) => void;
};

const CSCheckbox = ({ checked, label, onChange }: Props) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.checked);

    return (
        <label className={styles.root}>
            <input checked={checked} className={styles.input} onChange={handleChange} type="checkbox" />
            <span aria-hidden className={styles.visual}>
                {checked ? '✓' : ''}
            </span>
            <span className={styles.title}>{label}</span>
        </label>
    );
};

export default CSCheckbox;
