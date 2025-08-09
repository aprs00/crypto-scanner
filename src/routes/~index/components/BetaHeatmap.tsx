import type { SelectOption } from '@/types/api';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import { memo } from 'react';

import type { ChartConfig } from '../types';

import { useBetaHeatmapData } from '../api';

export type BetaHeatmapProps = {
    tf: string;
    type: string;
    timeFrameOptions: SelectOption[];
    typeOptions: SelectOption[];
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const BetaHeatmap = (props: BetaHeatmapProps) => {
    const { tf, type, timeFrameOptions, typeOptions, onAddClick, onRemoveClick, onConfigChange } = props;

    const betaHeatmap = useBetaHeatmapData({ duration: tf, type });

    const selects = [
        {
            componentName: 'select',
            id: '1',
            onChange: (tf: string) => {
                onConfigChange?.({ tf });
            },
            options: timeFrameOptions,
            value: tf,
        },
        {
            componentName: 'select',
            id: '2',
            onChange: (type: string) => {
                onConfigChange?.({ type });
            },
            options: typeOptions,
            value: type,
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
