import {memo, useState} from 'react';

import {ChartContainer, Heatmap} from '@/components/Charts';

import {useZScoreHeatmap} from '../api';
import {ZScoreHeatmapProps} from '../types';

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

    return <ChartContainer body={<Heatmap data={heatmap} />} selects={selects} title="Z Score Heatmap 1h" />;
};

export default memo(PearsonHeatmap);
