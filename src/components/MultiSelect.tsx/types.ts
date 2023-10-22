import {Dispatch, SetStateAction} from 'react';

export type MultiSelectPropsType = {
    options: OptionsObjectType[];
    values: string[];
    onChange: Dispatch<SetStateAction<string[]>>;
    label?: string;
};

export type OptionsObjectType = {
    value: string;
    label: string;
};

export type XIconPropsType = {
    width?: number;
    height?: number;
};
