import {Dispatch, ReactNode, SetStateAction} from 'react';

import {SelectOption} from '@/routes/~index/types';

export type ChartContainerPropsType = {
    body: ReactNode;
    title: string;
    selects?: {
        componentName: string;
        id: string;
        onChange: Dispatch<SetStateAction<string>>;
        options: SelectOption[];
        value: string;
        class?: string;
    }[];
};
