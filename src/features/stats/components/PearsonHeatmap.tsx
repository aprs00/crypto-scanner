import {memo} from 'react';

import Heatmap from '@/components/Heatmap';

import {usePearsonCorrelation} from '../api';
import ChartContainer from '../components/ChartContainer';
import type {PearsonHeatmap} from '../types';

const PearsonHeatmap = (props: PearsonHeatmap) => {
    const {tf} = props;

    const pearsonCorrelation = usePearsonCorrelation(tf);

    return (
        <>
            <ChartContainer
                header={
                    <>
                        <h3 className="text-gray-300">{tf} Pearson correlation</h3>
                    </>
                }
                body={<Heatmap data={pearsonCorrelation} />}
            />
        </>
    );
};

export default memo(PearsonHeatmap);
