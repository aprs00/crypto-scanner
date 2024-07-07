import {Dispatch, SetStateAction} from 'react';

export type SelectPropsType = {
    options: {value: string; label: string}[];
    value: string;
    classes?: string;
    onChange: Dispatch<SetStateAction<string>>;
};
