import {memo, useState} from 'react';

import {ChartContainer, Heatmap} from '@/components/Charts';

import {useCorrelations} from '../api';
import {PearsonHeatmapProps} from '../types';

const PearsonHeatmap = (props: PearsonHeatmapProps) => {
    const {tf, timeFrameOptions, type, typeOptions} = props;

    const [selectedTf, setSelectedTf] = useState(tf);
    const [selectedType, setSelectedType] = useState(type);

    const pearsonCorrelation = useCorrelations(selectedTf, selectedType);

    const selects = [
        {
            componentName: 'select',
            id: '1',
            onChange: setSelectedTf,
            options: timeFrameOptions,
            value: selectedTf,
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
            body={<Heatmap data={pearsonCorrelation.data} />}
            selects={selects}
            title="Pearson / Spearman"
        />
    );
};

export default memo(PearsonHeatmap);
