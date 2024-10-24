import {memo, useState} from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import {SelectOption} from '@/types/api';

import {useZScoreHeatmap} from '../api';

export type ZScoreHeatmapProps = {
    type: string;
    typeOptions: SelectOption[];
};

const PearsonHeatmap = (props: ZScoreHeatmapProps) => {
    const {type, typeOptions} = props;
    const [selectedType, setSelectedType] = useState(type);
    const heatmap = useZScoreHeatmap(selectedType);
    const selects = [
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
            body={<CSHeatmap data={heatmap.data} tooltipType="duration" />}
            selects={selects}
            title="Z Score Heatmap"
        />
    );
};
export default memo(PearsonHeatmap);