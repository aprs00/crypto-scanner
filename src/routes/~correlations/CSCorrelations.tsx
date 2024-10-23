import {Responsive, WidthProvider} from 'react-grid-layout';

import {useCorrelationsTimeframeOptions, useCorrelationTypeOptions} from './api';
import CorrelationsHeatmap from './components/CorrelationHeatmap';

const gridLayoutRowHeight = 30;
const ResponsiveGridLayout = WidthProvider(Responsive);

const CSCorrelations = () => {
    const timeFrameOptions = useCorrelationsTimeframeOptions();
    const typeOptions = useCorrelationTypeOptions();

    const gridLayouts = [
        {
            component: (
                <CorrelationsHeatmap
                    tf="5m"
                    timeFrameOptions={timeFrameOptions.data || []}
                    type="price"
                    typeOptions={typeOptions.data || []}
                />
            ),
            gridLayout: {h: 28, w: 12, x: 0, y: 0},
            key: 'correlation1',
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

export default CSCorrelations;
