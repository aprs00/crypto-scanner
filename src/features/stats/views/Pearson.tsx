import {memo} from 'react';

import Heatmap from '@/components/Heatmap';

import {usePearsonCorrelation} from '../api';
import ChartContainer from '../components/ChartContainer';

const BetaHeatmap = () => {
    const betaHeatmap = usePearsonCorrelation();

    return (
        <>
            <ChartContainer
                header={
                    <>
                        <h3 className="text-gray-300">5m Pearson correlation</h3>
                    </>
                }
                body={<Heatmap data={betaHeatmap} />}
            />
        </>
    );
};

export default memo(BetaHeatmap);
