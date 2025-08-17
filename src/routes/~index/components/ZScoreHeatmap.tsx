import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import { SelectOption } from '@/types/api';
import { memo, useState } from 'react';

import type { ChartConfig } from '../types';

import { useZScoreHeatmap } from '../api';

export type ZScoreHeatmapProps = {
    tf: string;
    type: string;
    typeOptions: SelectOption[];
    timeFrameOptions: SelectOption[];
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const PearsonHeatmap = (props: ZScoreHeatmapProps) => {
    const { tf, type, typeOptions, timeFrameOptions, onAddClick, onRemoveClick, onConfigChange } = props;

    const [selectedType, setSelectedType] = useState(type);
    const heatmap = useZScoreHeatmap({ type: selectedType, duration: tf });

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
            class: 'w-24',
            componentName: 'select',
            id: '2',
            onChange: setSelectedType,
            options: typeOptions,
            value: selectedType,
        },
    ];

    return (
        <ChartContainer
            body={<CSHeatmap data={heatmap.data} />}
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            selects={selects}
            title="Z Score Heatmap"
        />
    );
};

export default memo(PearsonHeatmap);
