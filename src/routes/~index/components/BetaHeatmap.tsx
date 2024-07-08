import {memo, useState} from 'react';

import {ChartContainer, Heatmap} from '@/components/Charts';
import {CustomSelect} from '@/components/UI';

import {useBetaHeatmapData} from '../api';
import type {BetaHeatmapProps} from '../types';

const BetaHeatmap = (props: BetaHeatmapProps) => {
    const {tf, timeFrameOptions} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const betaHeatmap = useBetaHeatmapData(selectedTf);

    return (
        <ChartContainer
            body={<Heatmap data={betaHeatmap} />}
            header={
                <>
                    <h3 className="text-gray-300">Pearson correlation</h3>
                    <div className="z-50">
                        <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                    </div>
                </>
            }
        />
    );
};

export default memo(BetaHeatmap);
