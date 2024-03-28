import {useState} from 'react';
import type {Layouts} from 'react-grid-layout';
import {Responsive, WidthProvider} from 'react-grid-layout';

import PearsonHeatmap from '../components/PearsonHeatmap';

const gridLayoutRowHeight = 30;

const ResponsiveGridLayout = WidthProvider(Responsive);

const Stats = () => {
    const [layouts, setLayouts] = useState<Layouts>();

    const gridLayouts = [
        {
            gridLayout: {w: 12, h: 24, x: 0, y: 0},
            component: <PearsonHeatmap tf="5m" />,
            key: 'pearsonCorrelation1',
        },
        {
            gridLayout: {w: 12, h: 24, x: 24, y: 0},
            component: <PearsonHeatmap tf="15m" />,
            key: 'pearsonCorrelation2',
        },
    ];

    return (
        <ResponsiveGridLayout
            cols={{lg: 12, md: 12, sm: 6, xs: 6, xxs: 6}}
            rowHeight={gridLayoutRowHeight}
            draggableHandle="#drag-handle"
            onLayoutChange={(_, layouts) => setLayouts(layouts)}
            layouts={layouts}
        >
            {gridLayouts.map((grid) => (
                <div key={grid.key} data-grid={grid.gridLayout} className="bg-slate-900 overflow-hidden rounded">
                    {grid.component}
                </div>
            ))}
        </ResponsiveGridLayout>
    );
};

export default Stats;