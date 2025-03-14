import { useCorrelationsTimeframeOptions, useCorrelationTypeOptions } from '@/routes/~correlations/api';
import { Responsive, WidthProvider } from 'react-grid-layout';

import ZScoreHeatmap from './components/ZScoreHeatmap';
import ZScoreMatrix from './components/ZScoreMatrix';

const gridLayoutRowHeight = 30;
const ResponsiveGridLayout = WidthProvider(Responsive);

const ZScore = () => {
    const timeFrameOptions = useCorrelationsTimeframeOptions();
    const typeOptions = useCorrelationTypeOptions();

    const gridLayouts = [
        {
            component: <ZScoreHeatmap type="price" typeOptions={typeOptions.data || []} />,
            gridLayout: { h: 26, w: 12, x: 0, y: 0 },
            key: 'zScoreHeatmap',
        },
        {
            component: (
                <ZScoreMatrix tf="5m" timeFrameOptions={timeFrameOptions.data || []} xAxis="price" yAxis="volume" />
            ),
            gridLayout: { h: 24, w: 12, x: 26, y: 0 },
            key: 'zScoreMatrix',
        },
    ];

    return (
        <ResponsiveGridLayout
            cols={{ lg: 12, md: 12, sm: 6, xs: 6, xxs: 6 }}
            draggableHandle="#drag-handle"
            rowHeight={gridLayoutRowHeight}
        >
            {gridLayouts.map((grid) => (
                <div className="bg-slate-900 overflow-hidden rounded-sm" data-grid={grid.gridLayout} key={grid.key}>
                    {grid.component}
                </div>
            ))}
        </ResponsiveGridLayout>
    );
};

export default ZScore;
