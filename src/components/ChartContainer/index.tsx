import DraggableIcon from '@/assets/svg/draggable.svg?react';

import type {ChartContainerPropsType} from './types';

const ChartContainer = (props: ChartContainerPropsType) => {
    const {header, body} = props;

    return (
        <div className="border-4 border-slate-800 rounded h-full">
            <div className="flex items-center pb-1 bg-slate-800 gap-1">
                <DraggableIcon id="drag-handle" />
                <div className="flex justify-between items-center flex-grow">{header}</div>
            </div>
            {body}
        </div>
    );
};

export default ChartContainer;
