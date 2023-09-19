import {Responsive, WidthProvider} from 'react-grid-layout';

import BetaHeatmap from '../components/BetaHeatmap';
import PriceChangePerDayOfWeek from '../components/PriceChangePerDayOfWeek';

import {useStatsSelectOptions} from '../api';

const gridLayoutRowHeight = 30;
const betaHeatmapLayout1 = {x: 0, y: 0, w: 6, h: 12};
const betaHeatmapLayout2 = {x: 6, y: 0, w: 6, h: 12};
const priceChangePerDayOfWeek1 = {x: 0, y: 12, w: 6, h: 12};
const priceChangePerDayOfWeek2 = {x: 6, y: 12, w: 6, h: 12};

const ResponsiveReactGridLayout = WidthProvider(Responsive);

const Beta = () => {
    const statsSelectOptions = useStatsSelectOptions();

    const gridLayouts = [
        {
            gridLayout: betaHeatmapLayout1,
            component: <BetaHeatmap tf="4h" options={statsSelectOptions?.data?.all || []} />,
            key: 'betaHeatmap1',
        },
        {
            gridLayout: betaHeatmapLayout2,
            component: <BetaHeatmap tf="1w" options={statsSelectOptions?.data?.all || []} />,
            key: 'betaHeatmap2',
        },
        {
            gridLayout: priceChangePerDayOfWeek1,
            component: <PriceChangePerDayOfWeek tf="2w" options={statsSelectOptions?.data?.htf || []} />,
            key: 'priceChangePerDayOfWeek1',
        },
        {
            gridLayout: priceChangePerDayOfWeek2,
            component: <PriceChangePerDayOfWeek tf="1m" options={statsSelectOptions?.data?.htf || []} />,
            key: 'priceChangePerDayOfWeek2',
        },
    ];

    return (
        <ResponsiveReactGridLayout
            cols={{lg: 12, md: 12, sm: 6, xs: 4, xxs: 2}}
            rowHeight={gridLayoutRowHeight}
            draggableHandle="#drag-handle"
        >
            {gridLayouts.map((grid) => (
                <div key={grid.key} data-grid={grid.gridLayout} className="bg-slate-900 overflow-hidden">
                    {grid.component}
                </div>
            ))}
        </ResponsiveReactGridLayout>
    );
};

export default Beta;
