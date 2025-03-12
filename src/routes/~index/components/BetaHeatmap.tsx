import {memo} from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import type {SelectOption} from '@/types/api';

import {useBetaHeatmapData} from '../api';
import type {ChartConfig} from '../types';

export type BetaHeatmapProps = {
    tf: string;
    timeFrameOptions: SelectOption[];
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const BetaHeatmap = (props: BetaHeatmapProps) => {
    const {tf, timeFrameOptions, onAddClick, onRemoveClick, onConfigChange} = props;

    const betaHeatmap = useBetaHeatmapData({duration: tf});

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
            body={<CSHeatmap data={betaHeatmap.data} />}
            selects={selects}
            title="Pearson correlation"
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
        />
    );
};

export default memo(BetaHeatmap);
