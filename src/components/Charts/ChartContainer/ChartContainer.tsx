import {ComponentProps, Dispatch, ReactNode, SetStateAction} from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';
import CSSelect from '@/components/UI/CSSelect';

const selectsMapper: {[key: string]: (props: ComponentProps<typeof CSSelect>) => ReactNode} = {
    select: CSSelect,
};

import {SelectOption} from '@/types/api';

export type ChartContainerPropsType = {
    body: ReactNode;
    title: string;
    selects?: {
        componentName: string;
        id: string;
        onChange: Dispatch<SetStateAction<string>> | ((value: string) => void);
        options: SelectOption[];
        value: string;
        class?: string;
    }[];
    onAddClick?: () => void;
    onRemoveClick?: () => void;
};

const IconButton = (props: {onClick: () => void; label: string}) => {
    return (
        <button
            className="text-white border border-slate-500 rounded-sm px-2 font-bold hover:bg-slate-700 cursor-pointer w-8"
            onClick={() => {
                props.onClick();
            }}
        >
            {props.label}
        </button>
    );
};

const ChartContainer = (props: ChartContainerPropsType) => {
    const {body, selects, title, onAddClick, onRemoveClick} = props;

    return (
        <div className="border-4 border-slate-800 rounded-sm h-full">
            <div className="flex items-center pb-1 bg-slate-800 gap-1">
                <DraggableIcon id="drag-handle" />
                <div className="flex justify-between items-center grow">
                    {title}
                    <div className="z-50 flex gap-2">
                        {onAddClick && (
                            <IconButton
                                label="+"
                                onClick={() => {
                                    onAddClick();
                                }}
                            />
                        )}
                        {onRemoveClick && (
                            <IconButton
                                label="-"
                                onClick={() => {
                                    onRemoveClick();
                                }}
                            />
                        )}
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
