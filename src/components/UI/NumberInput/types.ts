import {Dispatch, SetStateAction} from 'react';

export type NumberInputPropsType = {
    value: number;
    onChange: Dispatch<SetStateAction<number>>;
};
