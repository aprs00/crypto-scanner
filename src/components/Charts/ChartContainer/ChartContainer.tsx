import {ReactNode} from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';
import {CustomSelect} from '@/components/UI';
import {SelectProps} from '@/components/UI/Select/types';

import type {ChartContainerPropsType} from './types';

const selectsMapper: {[key: string]: (props: SelectProps) => ReactNode} = {
    select: CustomSelect,
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

export {ChartContainer};
