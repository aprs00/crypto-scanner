import {ComponentProps, Dispatch, ReactNode, SetStateAction} from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';

import CSSelect from '../../UI/CSSelect';

const selectsMapper: {[key: string]: (props: ComponentProps<typeof CSSelect>) => ReactNode} = {
    select: CSSelect,
};

import {SelectOption} from '@/types';

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

const ChartContainer = (props: ChartContainerPropsType) => {
    const {body, selects, title} = props;

    return (
        <div className="border-4 border-slate-800 rounded h-full">
            <div className="flex items-center pb-1 bg-slate-800 gap-1">
                <DraggableIcon id="drag-handle" />
                <div className="flex justify-between items-center flex-grow">
                    {title}
                    <div className="z-50 flex gap-2">
                        {selects?.map((select) => {
                            const Component = selectsMapper[select.componentName];

                            return (
                                <Component
                                    classes={select.class}
                                    key={select.id}
                                    options={select.options}
                                    value={select.value}
                                    onChange={select.onChange}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
            {body}
        </div>
    );
};

export default ChartContainer;
