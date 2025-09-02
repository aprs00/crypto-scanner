import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import { memo, useState } from 'react';

import type { ChartConfig } from '../types';

import { useZScoreHeatmap } from '../api';

export type ZScoreHeatmapProps = {
    hours: string;
    type: string;
    typeOptions: string[];
    hoursOptions: Record<string, string>;
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const ZScoreHeatmap = (props: ZScoreHeatmapProps) => {
    const { hours, type, typeOptions, hoursOptions, onAddClick, onRemoveClick, onConfigChange } = props;

    const [selectedType, setSelectedType] = useState(type);
    const heatmap = useZScoreHeatmap({ type: selectedType, hours });

    const selects = [
        {
            componentName: 'select',
            id: '1',
            onChange: (hours: string) => {
                onConfigChange?.({ hours });
            },
            options: hoursOptions,
            value: hours,
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

export default memo(ZScoreHeatmap);
