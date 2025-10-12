import { ReactNode } from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';
import IconButton from '@/components/UI/CSIconButton';

export type ChartContainerProps = {
    children: ReactNode;
    title: string;
    controls?: ReactNode;
    onAddClick?: () => void;
    onRemoveClick?: () => void;
};

const ChartContainer = (props: ChartContainerProps) => {
    const { children, controls, title, onAddClick, onRemoveClick } = props;

    return (
        <div className="border-4 border-slate-800 rounded-sm h-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center w-full pb-1 bg-slate-800 gap-2 md:gap-1">
                <div className="flex items-center flex-shrink-0 min-w-0">
                    <DraggableIcon className="size-6 flex-shrink-0" id="drag-handle" />
                    <span className="ml-0.5 truncate">{title}</span>
                </div>

                <div className="z-50 flex gap-2 flex-wrap justify-end md:justify-end items-center flex-1">
                    {onRemoveClick && <IconButton label="-" onClick={onRemoveClick} />}
                    {onAddClick && <IconButton label="+" onClick={onAddClick} />}
                    {controls}
                </div>
            </div>
            {children}
        </div>
    );
};

export default ChartContainer;
