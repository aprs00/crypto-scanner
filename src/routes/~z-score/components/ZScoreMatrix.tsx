import {memo, useState} from 'react';

import {ChartContainer, Scatter} from '@/components/Charts';

import {useZScoreMatrixLarge} from '../api';
import {ScatterProps} from '../types';

const ZScoreMatrix = (props: ScatterProps) => {
    const {tf, timeFrameOptions, xAxis, yAxis} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const zScoreMatrix = useZScoreMatrixLarge(xAxis, yAxis, selectedTf);

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
            body={<Scatter data={zScoreMatrix.data || []} xAxis={xAxis} yAxis={yAxis} />}
            selects={selects}
            title="Z Score"
        />
    );
};

export default memo(ZScoreMatrix);
