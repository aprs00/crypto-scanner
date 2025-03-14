import ChartContainer from '@/components/Charts/ChartContainer';
import CSScatter from '@/components/Charts/CSScatter';
import {SelectOption} from '@/types/api';

import {useZScoreMatrix} from '../api';
import {ChartConfig} from '../types';

export type ScatterProps = {
    timeFrameOptions: SelectOption[];
    xAxis: string;
    yAxis: string;
    tf: string;
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const ZScoreMatrix = (props: ScatterProps) => {
    const {tf, timeFrameOptions, xAxis, yAxis, onAddClick, onRemoveClick, onConfigChange} = props;

    const zScoreMatrix = useZScoreMatrix({
        duration: tf,
        xAxis,
        yAxis,
    });

    const selects = [
        {
            componentName: 'select',
            id: '1',
            onChange: (val: string) => {
                onConfigChange?.({tf: val});
            },
            options: timeFrameOptions,
            value: tf,
        },
    ];

    return (
        <ChartContainer
            body={<CSScatter data={zScoreMatrix.data || []} xAxis={xAxis} yAxis={yAxis} />}
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            selects={selects}
            title="Z Score"
        />
    );
};
export default ZScoreMatrix;
