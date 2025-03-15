import { ChangeEvent, Dispatch, SetStateAction } from 'react';

import DownIcon from './DownIcon';
import UpIcon from './UpIcon';

export type NumberInputPropsType = {
    value: number;
    onChange: Dispatch<SetStateAction<number>>;
};

const NumberInput = (props: NumberInputPropsType) => {
    const { onChange, value } = props;

    const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);

        if (isNaN(val)) return;
        if (val > 1000 || val <= 0) return;
        onChange(val);
    };

    return (
        <div className="w-20 relative">
            <input
                className="w-full border bg-slate-800 rounded-xs border-slate-500 px-2 h-7 text-left relative"
                onChange={handleInput}
                placeholder="Ticks"
                value={value}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                <div className="flex flex-col pr-px">
                    <button
                        onClick={() => {
                            if (value > 1000) return;
                            onChange((value) => Number(value) + 1);
                        }}
                    >
                        <UpIcon />
                    </button>
                    <button
                        onClick={() => {
                            if (value === 1) return;
                            if (value > 1000) return;
                            onChange((value) => Number(value) - 1);
                        }}
                    >
                        <DownIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NumberInput;
