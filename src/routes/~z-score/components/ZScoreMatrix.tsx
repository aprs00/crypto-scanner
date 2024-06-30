import {memo, useState} from 'react';

import ChartContainer from '@/components/ChartContainer';
import Scatter from '@/components/Scatter';
import CustomSelect from '@/components/Select';

import {useZScoreMatrixLarge} from '../api';
import {ScatterPropsType} from '../types';

const ZScoreMatrix = (props: ScatterPropsType) => {
    const {tf, timeFrameOptions, xAxis, yAxis} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const zScoreMatrix = useZScoreMatrixLarge(xAxis, yAxis, selectedTf);

    return (
        <>
            <ChartContainer
                body={<Scatter data={zScoreMatrix?.data || []} xAxis={xAxis} yAxis={yAxis} />}
                header={
                    <>
                        <h3 className="text-gray-300">Z Score</h3>
                        <div className="z-50 flex gap-2">
                            <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                        </div>
                    </>
                }
            />
        </>
    );
};

export default memo(ZScoreMatrix);
