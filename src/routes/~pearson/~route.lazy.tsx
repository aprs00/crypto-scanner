import {createLazyFileRoute} from '@tanstack/react-router';
import {useState} from 'react';
import type {Layouts} from 'react-grid-layout';
import {Responsive, WidthProvider} from 'react-grid-layout';

import PearsonHeatmap from '@/routes/~pearson/components/Heatmap';

import {usePearsonTimeframeOptions, usePearsonTypeOptions} from './api';

const gridLayoutRowHeight = 30;
const ResponsiveGridLayout = WidthProvider(Responsive);

export const Route = createLazyFileRoute('/pearson')({
    component: Pearson,
});

function Pearson() {
    const [layouts, setLayouts] = useState<Layouts>();

    const timeFrameOptions = usePearsonTimeframeOptions();
    const typeOptions = usePearsonTypeOptions();

    const gridLayouts = [
        {
            gridLayout: {w: 12, h: 24, x: 0, y: 0},
            component: (
                <PearsonHeatmap
                    tf="5m"
                    timeFrameOptions={timeFrameOptions?.data || []}
                    type="price"
                    typeOptions={typeOptions.data || []}
                />
            ),
            key: 'pearsonCorrelation1',
        },
    ];

    return (
        <ResponsiveGridLayout
            cols={{lg: 12, md: 12, sm: 6, xs: 6, xxs: 6}}
            draggableHandle="#drag-handle"
            layouts={layouts}
            rowHeight={gridLayoutRowHeight}
            onLayoutChange={(_, layouts) => setLayouts(layouts)}
        >
            {gridLayouts.map((grid) => (
                <div className="bg-slate-900 overflow-hidden rounded" data-grid={grid.gridLayout} key={grid.key}>
                    {grid.component}
                </div>
            ))}
        </ResponsiveGridLayout>
    );
}
