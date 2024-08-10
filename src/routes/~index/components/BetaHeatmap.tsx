import {memo, useState} from 'react';

import {ChartContainer, Heatmap} from '@/components/Charts';

import {useBetaHeatmapData} from '../api';
import type {BetaHeatmapProps} from '../types';

const BetaHeatmap = (props: BetaHeatmapProps) => {
    const {tf, timeFrameOptions} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const betaHeatmap = useBetaHeatmapData(selectedTf);

    const selects = [
        {
            componentName: 'select',
            id: '1',
            onChange: setSelectedTf,
            options: timeFrameOptions,
            value: selectedTf,
        },
    ];

    return <ChartContainer body={<Heatmap data={betaHeatmap.data} />} selects={selects} title="Pearson correlation" />;
};

export default memo(BetaHeatmap);
