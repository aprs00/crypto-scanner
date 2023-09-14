import {memo} from 'react';

import type {ChartContainerPropsType} from '../types';

const ChartContainer = (props: ChartContainerPropsType) => {
    const {header, body} = props;

    return (
        <div className="border-4 border-slate-800 rounded h-full">
            <div id="drag-handle" className="flex justify-between items-center pl-2 py-1 bg-slate-800">
                {header}
            </div>
            {body}
        </div>
    );
};

export default memo(ChartContainer);
