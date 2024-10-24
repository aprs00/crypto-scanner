import {memo, useState} from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import type {SelectOption} from '@/types/api';

import {useBetaHeatmapData} from '../api';

export type BetaHeatmapProps = {
    tf: string;
    timeFrameOptions: SelectOption[];
};

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

    return (
        <ChartContainer body={<CSHeatmap data={betaHeatmap.data} />} selects={selects} title="Pearson correlation" />
    );
};

export default memo(BetaHeatmap);
