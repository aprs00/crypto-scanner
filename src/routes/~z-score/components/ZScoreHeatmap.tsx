import {memo} from 'react';

import {ChartContainer, Heatmap} from '@/components/Charts';

import {useZScoreHeatmap} from '../api';

const PearsonHeatmap = () => {
    const heatmap = useZScoreHeatmap();

    console.log(heatmap);

    return <ChartContainer body={<Heatmap data={heatmap} />} title="Z Score Heatmap 1h" />;
};

export default memo(PearsonHeatmap);
