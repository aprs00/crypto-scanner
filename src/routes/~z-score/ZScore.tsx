import {useState} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import CSScatter from '@/components/Charts/CSScatter';
import {useCorrelationsTimeframeOptions, useCorrelationTypeOptions} from '@/routes/~correlations/api';
import {useZScoreHeatmap, useZScoreMatrixLarge} from '@/routes/~z-score/api';

const gridLayoutRowHeight = 30;
const ResponsiveGridLayout = WidthProvider(Responsive);

const ZScore = () => {
    const [selectedTypeZScoreHeatmap, setSelectedTypeZScoreHeatmap] = useState('price');
    const [selectedTfZScoreMatrixLarge, setSelectedTfZScoreMatrixLarge] = useState('5m');

    const timeFrameOptions = useCorrelationsTimeframeOptions();
    const typeOptions = useCorrelationTypeOptions();
    const zScoreMatrixLarge = useZScoreMatrixLarge('price', 'volume', selectedTfZScoreMatrixLarge);
    const zScoreHeatmap = useZScoreHeatmap(selectedTypeZScoreHeatmap);

    const gridLayouts = [
        {
            component: (
                <ChartContainer
                    body={<CSHeatmap data={zScoreHeatmap.data} tooltipType="duration" />}
                    selects={[
                        {
                            class: 'w-24',
                            componentName: 'select',
                            id: '2',
                            onChange: setSelectedTypeZScoreHeatmap,
                            options: typeOptions.data || [],
                            value: selectedTypeZScoreHeatmap,
                        },
                    ]}
                    title="Z Score Heatmap"
                />
            ),
            gridLayout: {h: 26, w: 12, x: 0, y: 0},
            key: 'zScoreHeatmap',
        },
        {
            component: (
                <ChartContainer
                    body={<CSScatter data={zScoreMatrixLarge.data || []} xAxis="trades" yAxis="volume" />}
                    selects={[
                        {
                            componentName: 'select',
                            id: '1',
                            onChange: setSelectedTfZScoreMatrixLarge,
                            options: timeFrameOptions.data || [],
                            value: selectedTfZScoreMatrixLarge,
                        },
                    ]}
                    title="Z Score"
                />
            ),
            gridLayout: {h: 24, w: 12, x: 26, y: 0},
            key: 'zScoreMatrix',
        },
    ];

    return (
        <ResponsiveGridLayout
            cols={{lg: 12, md: 12, sm: 6, xs: 6, xxs: 6}}
            draggableHandle="#drag-handle"
            rowHeight={gridLayoutRowHeight}
        >
            {gridLayouts.map((grid) => (
                <div className="bg-slate-900 overflow-hidden rounded" data-grid={grid.gridLayout} key={grid.key}>
                    {grid.component}
                </div>
            ))}
        </ResponsiveGridLayout>
    );
};

export default ZScore;
