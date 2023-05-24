import {memo} from 'react';

import type {NumberInputPropsType} from './types';

import UpIcon from './UpIcon';
import DownIcon from './DownIcon';

const NumberInput = (props: NumberInputPropsType) => {
    const {value, onChange} = props;

    return (
        <div className="w-20 relative m-1">
            <input
                className="w-full bg-slate-800 rounded-sm px-3 h-6 text-left"
                value={value}
                onChange={(e) => {
                    console.log(e.target.value);
                    if (isNaN(Number(e.target.value))) return;
                    onChange(Number(e.target.value));
                }}
                placeholder="Ticks"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
                <div className="flex flex-col pr-px">
                    <button
                        onClick={() => {
                            onChange((value) => Number(value) + 1);
                        }}
                    >
                        <UpIcon />
                    </button>
                    <button
                        onClick={() => {
                            if (value === 0) return;
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

export default memo(NumberInput);
