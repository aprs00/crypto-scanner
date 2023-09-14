import {Responsive, WidthProvider} from 'react-grid-layout';

import BetaHeatmap from '../components/BetaHeatmap';
import PriceChangePerDayOfWeek from '../components/PriceChangePerDayOfWeek';

import {useStatsSelectOptions} from '../api';

const gridLayoutRowHeight = 30;
const betaHeatMapLayout = {x: 0, y: 0, w: 12, h: 12};
const priceChangePerDayOfWeek1 = {x: 0, y: 12, w: 6, h: 12};
const priceChangePerDayOfWeek2 = {x: 6, y: 12, w: 6, h: 12};
const priceChangePerDayOfWeek3 = {x: 0, y: 24, w: 12, h: 12};

const gridLayouts = [
    {
        gridLayout: betaHeatMapLayout,
        component: <BetaHeatmap />,
        key: 'betaHeatMap',
    },
    {
        gridLayout: priceChangePerDayOfWeek1,
        component: <PriceChangePerDayOfWeek tf="2w" />,
        key: 'priceChangePerDayOfWeek1',
    },
    {
        gridLayout: priceChangePerDayOfWeek2,
        component: <PriceChangePerDayOfWeek tf="1m" />,
        key: 'priceChangePerDayOfWeek2',
    },
    {
        gridLayout: priceChangePerDayOfWeek3,
        component: <PriceChangePerDayOfWeek tf="6m" />,
        key: 'priceChangePerDayOfWeek3',
    },
];

const ResponsiveReactGridLayout = WidthProvider(Responsive);

const Beta = () => {
    const statsSelectOptions = useStatsSelectOptions();

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
