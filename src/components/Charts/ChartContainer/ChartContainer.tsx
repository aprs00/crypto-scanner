import { Dispatch, ReactNode, SetStateAction } from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';
import IconButton from '@/components/UI/CSIconButton';
import CSSelect from '@/components/UI/CSSelect';

export const ComponentName = {
    Select: 'select',
} as const;

export type ComponentName = (typeof ComponentName)[keyof typeof ComponentName];

export type ChartContainerProps = {
    body: ReactNode;
    title: string;
    selects?: {
        componentName: ComponentName;
        onChange: Dispatch<SetStateAction<string>> | ((value: string) => void);
        options: Record<string, string> | string[];
        value: string;
        class?: string;
    }[];
    onAddClick?: () => void;
    onRemoveClick?: () => void;
};

const ChartContainer = (props: ChartContainerProps) => {
    const { body, selects, title, onAddClick, onRemoveClick } = props;

    return (
        <div className="border-4 border-slate-800 rounded-sm h-full">
            <div className="flex justify-between items-center w-full pb-1 bg-slate-800 gap-1">
                <div className="flex items-center flex-shrink">
                    <DraggableIcon className="size-6 flex-shrink-0" id="drag-handle" />
                    <span className="ml-0.5">{title}</span>
                </div>

                <div className="z-50 flex gap-2 flex-wrap justify-end flex-shrink-0 max-w-[200px] md:max-w-[300px]">
                    {onAddClick && <IconButton label="+" onClick={onAddClick} />}
                    {onRemoveClick && <IconButton label="-" onClick={onRemoveClick} />}

                    {selects?.map((select, idx) => {
                        if (select.componentName !== ComponentName.Select) return null;
                        return (
                            <CSSelect<string>
                                classes={select.class}
                                key={idx}
                                onChange={select.onChange}
                                options={select.options}
                                value={select.value}
                            />
                        );
                    })}
                </div>
            </div>
            {body}
        </div>
    );
};

export default ChartContainer;
