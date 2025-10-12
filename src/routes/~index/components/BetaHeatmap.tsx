import ChartContainer, { ComponentName } from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';

import type { ChartConfig } from '../types';

import { useBetaHeatmapData } from '../api';

export type BetaHeatmapProps = {
    hours: string;
    dataType: string;
    hoursOptions: Record<string, string>;
    typeOptions: string[];
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const BetaHeatmap = (props: BetaHeatmapProps) => {
    const { hours, dataType, hoursOptions, typeOptions, onAddClick, onRemoveClick, onConfigChange } = props;

    const betaHeatmap = useBetaHeatmapData({ hours, type: dataType });

    const selects = [
        {
            componentName: ComponentName.Select,
            onChange: (hours: string) => {
                onConfigChange?.({ hours });
            },
            options: hoursOptions,
            value: hours,
        },
        {
            class: 'w-24',
            componentName: ComponentName.Select,
            onChange: (dataType: string) => {
                onConfigChange?.({ type: dataType });
            },
            options: typeOptions,
            value: dataType,
        },
    ];

    return (
        <ChartContainer
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            selects={selects}
            title="Pearson correlation"
        >
            <CSHeatmap data={betaHeatmap.data} />
        </ChartContainer>
    );
};

export default BetaHeatmap;
