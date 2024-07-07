import {memo, useState} from 'react';

import {ChartContainer, Heatmap} from '@/components/Charts';
import {CustomSelect} from '@/components/UI';

import {useCorrelations} from '../api';
import {PearsonHeatmapProps} from '../types';

const PearsonHeatmap = (props: PearsonHeatmapProps) => {
    const {tf, timeFrameOptions, type, typeOptions} = props;

    const [selectedTf, setSelectedTf] = useState(tf);
    const [selectedType, setSelectedType] = useState(type);

    const pearsonCorrelation = useCorrelations(selectedTf, selectedType);

    return (
        <>
            <ChartContainer
                body={<Heatmap data={pearsonCorrelation} />}
                header={
                    <>
                        <h3 className="text-gray-300">Pearson / Spearman Correlation</h3>
                        <div className="z-50 flex gap-2">
                            <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                            <CustomSelect
                                classes="w-24"
                                options={typeOptions}
                                value={selectedType}
                                onChange={setSelectedType}
                            />
                        </div>
                    </>
                }
            />
        </>
    );
};

export default memo(PearsonHeatmap);
