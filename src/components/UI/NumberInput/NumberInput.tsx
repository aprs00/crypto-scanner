import type { ChangeEvent, ReactNode } from 'react';

import styles from './NumberInput.module.css';

type NumberInputPropsType = {
    ariaDescribedBy?: string;
    ariaLabel?: string;
    className?: string;
    id?: string;
    max?: number;
    min?: number;
    onChange: (value: number) => void;
    placeholder?: string;
    prefix?: ReactNode;
    step?: number;
    value: number;
};

const NumberInput = (props: NumberInputPropsType) => {
    const {
        ariaDescribedBy,
        ariaLabel = 'Numeric value',
        className = '',
        id,
        max = 1000,
        min = 1,
        onChange,
        placeholder = 'TICKS',
        prefix,
        step,
        value,
    } = props;
    const increment = step && Number.isFinite(step) && step > 0 ? step : 1;

    const handleIncrement = () => {
        if (value >= max) return;
        onChange(Math.min(max, Number(value) + increment));
    };

    const handleDecrement = () => {
        if (value <= min) return;
        onChange(Math.max(min, Number(value) - increment));
    };

    const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
        const next = Number(event.currentTarget.value);
        if (Number.isNaN(next) || next > max || next < min) return;
        onChange(next);
    };

    return (
        <div className={[styles.root, className].filter(Boolean).join(' ')}>
            {prefix && (
                <span aria-hidden className={styles.prefix}>
                    {prefix}
                </span>
            )}
            <input
                aria-describedby={ariaDescribedBy}
                aria-label={ariaLabel}
                id={id}
                inputMode="decimal"
                max={max}
                min={min}
                onChange={handleInput}
                placeholder={placeholder}
                step={step ?? 'any'}
                type="number"
                value={value}
            />
            <div className={styles.buttons}>
                <button
                    aria-label={`Increase ${ariaLabel.toLowerCase()}`}
                    className={styles.arrow}
                    onClick={handleIncrement}
                    type="button"
                >
                    ▲
                </button>
                <button
                    aria-label={`Decrease ${ariaLabel.toLowerCase()}`}
                    className={styles.arrow}
                    onClick={handleDecrement}
                    type="button"
                >
                    ▼
                </button>
            </div>
        </div>
    );
};

export default NumberInput;
