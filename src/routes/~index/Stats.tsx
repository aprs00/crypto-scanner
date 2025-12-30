import { Responsive, WidthProvider } from 'react-grid-layout';

import ChartWrapper from './components/ChartWrapper';
import useChartStore, { chartTemplates, CHART_HEIGHT } from './useChartStore';

const ResponsiveGridLayout = WidthProvider(Responsive);

const Stats = () => {
    const chartIds = useChartStore((state) => state.chartIds);
    const savedGridLayouts = useChartStore((state) => state.savedGridLayouts);
    const handleLayoutChange = useChartStore((state) => state.handleLayoutChange);

    const gridLayouts = chartIds.map((chart, index) => {
        const template = chartTemplates[chart.type];
        const savedLayout = savedGridLayouts[chart.id] || {};

        return {
            component: <ChartWrapper chart={chart} savedLayout={savedLayout} />,
            gridLayout: {
                ...template.gridLayout,
                ...savedLayout?.layout,
                y: index * CHART_HEIGHT,
            },
            key: chart.id,
        };
    });

    return (
        <ResponsiveGridLayout
            cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
            draggableHandle="#drag-handle"
            onLayoutChange={handleLayoutChange}
            rowHeight={30}
        >
            {gridLayouts.map((grid) => (
                <div className="bg-slate-900 overflow-hidden rounded-sm" data-grid={grid.gridLayout} key={grid.key}>
                    {grid.component}
                </div>
            ))}
        </ResponsiveGridLayout>
    );
};

export default Stats;
