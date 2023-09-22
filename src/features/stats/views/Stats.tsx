import {Responsive, WidthProvider} from 'react-grid-layout';

import BetaHeatmap from '../components/BetaHeatmap';
import PriceChangePerDayOfWeek from '../components/PriceChangePerDayOfWeek';

import {useStatsSelectOptions, useFetchTickersOptions} from '../api';
import Scatter from '../components/ZScoreMatrix';

const gridLayoutRowHeight = 30;
const betaHeatmapLayout1 = {x: 0, y: 0, w: 6, h: 12};
const betaHeatmapLayout2 = {x: 6, y: 0, w: 6, h: 12};
const scatterLayout1 = {x: 0, y: 12, w: 6, h: 14};
const scatterLayout2 = {x: 6, y: 12, w: 6, h: 14};
const priceChangePerDayOfWeek1 = {x: 0, y: 26, w: 6, h: 12};
const priceChangePerDayOfWeek2 = {x: 6, y: 26, w: 6, h: 12};

const ResponsiveReactGridLayout = WidthProvider(Responsive);

const Beta = () => {
    const timeFrameOptions = useStatsSelectOptions();
    const tickerOptions = useFetchTickersOptions();

    const gridLayouts = [
        {
            gridLayout: betaHeatmapLayout1,
            component: <BetaHeatmap tf="4h" timeFrameOptions={timeFrameOptions?.data?.all || []} />,
            key: 'betaHeatmap1',
        },
        {
            gridLayout: betaHeatmapLayout2,
            component: <BetaHeatmap tf="1w" timeFrameOptions={timeFrameOptions?.data?.all || []} />,
            key: 'betaHeatmap2',
        },
        {
            gridLayout: scatterLayout1,
            component: (
                <Scatter tf="1m" xAxis="price" yAxis="volume" timeFrameOptions={timeFrameOptions?.data?.all || []} />
            ),
            key: 'scatter1',
        },
        {
            gridLayout: scatterLayout2,
            component: (
                <Scatter tf="2w" xAxis="trades" yAxis="volume" timeFrameOptions={timeFrameOptions?.data?.all || []} />
            ),
            key: 'scatter2',
        },
        {
            gridLayout: priceChangePerDayOfWeek1,
            component: (
                <PriceChangePerDayOfWeek
                    tf="2w"
                    symbol="BTCUSDT"
                    timeFrameOptions={timeFrameOptions?.data?.htf || []}
                    tickerOptions={tickerOptions?.data || []}
                />
            ),
            key: 'priceChangePerDayOfWeek1',
        },
        {
            gridLayout: priceChangePerDayOfWeek2,
            component: (
                <PriceChangePerDayOfWeek
                    tf="1m"
                    symbol="ETHUSDT"
                    timeFrameOptions={timeFrameOptions?.data?.htf || []}
                    tickerOptions={tickerOptions?.data || []}
                />
            ),
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
