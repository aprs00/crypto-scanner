import ChartContainer from '@/components/Charts/ChartContainer';
import CSScatter from '@/components/Charts/CSScatter';
import { SelectOption } from '@/types/api';
import { memo, useState } from 'react';

import { useZScoreMatrixLarge } from '../api';

export type ScatterProps = {
    timeFrameOptions: SelectOption[];
    xAxis: string;
    yAxis: string;
    tf: string;
};

const ZScoreMatrix = (props: ScatterProps) => {
    const { tf, timeFrameOptions, xAxis, yAxis } = props;
    const [selectedTf, setSelectedTf] = useState(tf);
    const zScoreMatrix = useZScoreMatrixLarge({
        tf: selectedTf,
        xAxis,
        yAxis,
    });
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
export default memo(ZScoreMatrix);
