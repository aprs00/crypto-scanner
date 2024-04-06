import {createLazyFileRoute} from '@tanstack/react-router';
import {Responsive, WidthProvider} from 'react-grid-layout';

import {usePearsonTimeframeOptions} from '@/routes/~pearson/api';

import ZScoreMatrix from './components/ZScoreMatrix';

const gridLayoutRowHeight = 30;
const ResponsiveGridLayout = WidthProvider(Responsive) as any;

export const Route = createLazyFileRoute('/z-score')({
    component: ZScore,
});

function ZScore() {
    const timeFrameOptions = usePearsonTimeframeOptions();

    const gridLayouts = [
        {
            component: (
                <ZScoreMatrix tf="5m" timeFrameOptions={timeFrameOptions?.data || []} xAxis="price" yAxis="volume" />
            ),
            gridLayout: {h: 24, w: 12, x: 0, y: 0},
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
}
