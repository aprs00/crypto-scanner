import {ComponentProps, Dispatch, ReactNode, SetStateAction} from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';
import IconButton from '@/components/UI/CSIconButton';
import CSSelect from '@/components/UI/CSSelect';

const selectsMapper: {[key: string]: (props: ComponentProps<typeof CSSelect>) => ReactNode} = {
    select: CSSelect,
};

import {SelectOption} from '@/types/api';

export type ChartContainerProps = {
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

const ChartContainer = (props: ChartContainerProps) => {
    const {body, selects, title, onAddClick, onRemoveClick} = props;

    return (
        <div className="border-4 border-slate-800 rounded-sm h-full">
            <div className="flex items-center pb-1 bg-slate-800 gap-1">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center min-w-0 flex-shrink">
                        <DraggableIcon className="size-6 flex-shrink-0" id="drag-handle" />
                        <span className="text-lg ml-2">{title}</span>
                    </div>

                    <div className="z-50 flex gap-2 flex-shrink-0 max-w-[200px] md:max-w-[300px] flex-wrap justify-end">
                        {onAddClick && <IconButton label="+" onClick={onAddClick} />}
                        {onRemoveClick && <IconButton label="-" onClick={onRemoveClick} />}

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
