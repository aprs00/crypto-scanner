import { ChangeEvent, Dispatch, SetStateAction } from 'react';

import styles from './NumberInput.module.css';

export type NumberInputPropsType = {
    value: number;
    onChange: Dispatch<SetStateAction<number>>;
};

const NumberInput = (props: NumberInputPropsType) => {
    const { onChange, value } = props;

    const handleIncrement = () => {
        if (value === 1000) return;
        onChange((value) => Number(value) + 1);
    };

    const handleDecrement = () => {
        if (value === 1) return;
        onChange((value) => Number(value) - 1);
    };

    const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (isNaN(val) || val > 1000 || val <= 0) return;
        onChange(val);
    };

    return (
        <div className={styles.root}>
            <input onChange={handleInput} placeholder="TICKS" value={value} />
            <div className={styles.buttons}>
                <button className={styles.arrow} onClick={handleIncrement} type="button">
                    ▲
                </button>
                <button className={styles.arrow} onClick={handleDecrement} type="button">
                    ▼
                </button>
            </div>
        </div>
    );
};

export default NumberInput;
