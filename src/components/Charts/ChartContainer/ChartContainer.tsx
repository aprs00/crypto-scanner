import { ReactNode } from 'react';

import CSPanel from '@/components/Layouts/CSPanel';
import IconButton from '@/components/UI/CSIconButton';
import { ChartType, ChartTypeLabels } from '@/routes/~index/types';

export type ChartContainerProps = {
    children: ReactNode;
    chartType: ChartType;
    controls?: ReactNode;
    onRemoveClick: () => void;
};

const ChartContainer = (props: ChartContainerProps) => {
    const { children, controls, chartType, onRemoveClick } = props;

    return (
        <CSPanel
            className="h-full"
            controls={
                <>
                    {controls}
                    <IconButton label="-" onClick={onRemoveClick} />
                </>
            }
            title={ChartTypeLabels[chartType]}
        >
            {children}
        </CSPanel>
    );
};

export default ChartContainer;
