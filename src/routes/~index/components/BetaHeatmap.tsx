import {memo, useState} from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import type {SelectOption} from '@/types/api';

import {useBetaHeatmapData} from '../api';

export type BetaHeatmapProps = {
    tf: string;
    timeFrameOptions: SelectOption[];
    onAddClick?: () => void;
    onRemoveClick?: () => void;
};

const BetaHeatmap = (props: BetaHeatmapProps) => {
    const {tf, timeFrameOptions, onAddClick, onRemoveClick} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const betaHeatmap = useBetaHeatmapData({duration: selectedTf});

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
            body={<CSHeatmap data={betaHeatmap.data} />}
            selects={selects}
            title="Pearson correlation"
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
        />
    );
};

export default memo(BetaHeatmap);
