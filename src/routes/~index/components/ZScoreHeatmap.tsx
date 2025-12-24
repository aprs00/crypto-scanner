import { useState } from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import CSSelect from '@/components/UI/CSSelect';

import type { ChartConfig, DataType } from '../types';

import { useZScoreHeatmap } from '../api';

export type ZScoreHeatmapProps = {
    hours: string;
    dataType: DataType;
    typeOptions: Array<DataType>;
    hoursOptions: Record<string, string>;
    onAddClick: () => void;
    onRemoveClick?: () => void;
    onConfigChange: (config: ChartConfig) => void;
};

const ZScoreHeatmap = (props: ZScoreHeatmapProps) => {
    const { hours, dataType, typeOptions, hoursOptions, onAddClick, onRemoveClick, onConfigChange } = props;

    const [selectedDataType, setSelectedDataType] = useState<DataType>(dataType);
    const heatmap = useZScoreHeatmap({ type: selectedDataType, hours });

    const controls = (
        <>
            <CSSelect<string>
                onChange={(hours) => {
                    onConfigChange({ hours });
                }}
                options={hoursOptions}
                value={hours}
            />
            <CSSelect<DataType>
                classes="w-24"
                onChange={setSelectedDataType}
                options={typeOptions}
                value={selectedDataType}
            />
        </>
    );

    return (
        <ChartContainer
            controls={controls}
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            title="Z Score Heatmap"
        >
            <CSHeatmap data={heatmap.data} visualMax={2} visualMin={-2} />
        </ChartContainer>
    );
};

export default ZScoreHeatmap;
