import type { SelectOption } from '@/types/api';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import { memo } from 'react';

import type { ChartConfig } from '../types';

import { useBetaHeatmapData } from '../api';

export type BetaHeatmapProps = {
    tf: string;
    timeFrameOptions: SelectOption[];
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const BetaHeatmap = (props: BetaHeatmapProps) => {
    const { tf, timeFrameOptions, onAddClick, onRemoveClick, onConfigChange } = props;

    const betaHeatmap = useBetaHeatmapData({ duration: tf });

    const selects = [
        {
            componentName: 'select',
            id: '1',
            onChange: (val: string) => {
                onConfigChange?.({ tf: val });
            },
            options: timeFrameOptions,
            value: tf,
        },
    ];

    return (
        <ChartContainer
            body={<CSHeatmap data={betaHeatmap.data} />}
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            selects={selects}
            title="Pearson correlation"
        />
    );
};

export default memo(BetaHeatmap);
