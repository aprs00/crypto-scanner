import {useState} from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSScatter from '@/components/Charts/CSScatter';
import {SelectOption} from '@/types/api';

import {useZScoreMatrix} from '../api';
export type ScatterProps = {
    timeFrameOptions: SelectOption[];
    xAxis: string;
    yAxis: string;
    tf: string;
};
const ZScoreMatrix = (props: ScatterProps) => {
    const {tf, timeFrameOptions, xAxis, yAxis} = props;
    const [selectedTf, setSelectedTf] = useState(tf);
    const zScoreMatrix = useZScoreMatrix(xAxis, yAxis, selectedTf);
    const selects = [
        {
            componentName: 'select',
            id: '1',
            onChange: setSelectedTf,
            options: timeFrameOptions,
            value: selectedTf,
        },
    ];
    return (
        <ChartContainer
            body={<CSScatter data={zScoreMatrix.data || []} xAxis={xAxis} yAxis={yAxis} />}
            selects={selects}
            title="Z Score"
        />
    );
};
export default ZScoreMatrix;
