import {Dispatch, SetStateAction} from 'react';

export type SelectProps = {
    options: {value: string; label: string}[];
    value: string;
    classes?: string;
    onChange: Dispatch<SetStateAction<string>>;
};
