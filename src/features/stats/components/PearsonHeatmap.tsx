import {memo, useState} from 'react';

import Heatmap from '@/components/Heatmap';
import CustomSelect from '@/components/Select';

import {usePearsonCorrelation} from '../api';
import ChartContainer from '../components/ChartContainer';
import {PearsonHeatmapProps} from '../types';

const PearsonHeatmap = (props: PearsonHeatmapProps) => {
    const {tf, type, timeFrameOptions, typeOptions} = props;

    const [selectedTf, setSelectedTf] = useState(tf);
    const [selectedType, setSelectedType] = useState(type);

    const pearsonCorrelation = usePearsonCorrelation(selectedTf, selectedType);

    return (
        <>
            <ChartContainer
                header={
                    <>
                        <h3 className="text-gray-300">
                            Pearson correlation - {type} - {tf}
                        </h3>
                        <div className="z-50 flex gap-2">
                            <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                            <CustomSelect
                                options={typeOptions}
                                value={selectedType}
                                onChange={setSelectedType}
                                classes="w-24"
                            />
                        </div>
                    </>
                }
                body={<Heatmap data={pearsonCorrelation} />}
            />
        </>
    );
};

export default memo(PearsonHeatmap);
