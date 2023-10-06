import {Responsive, WidthProvider} from 'react-grid-layout';

import BetaHeatmap from './components/BetaHeatmap';
import Scatter from './components/ZScoreMatrix';
import ZScoreHistory from './components/ZScoreHistory';
import PriceChangePerDayOfWeek from './components/PriceChangePercentage';

import {useStatsSelectOptions, useFetchTickersOptions} from './api';

const gridLayoutRowHeight = 30;
const betaHeatmapLayout1 = {x: 0, y: 0, w: 6, h: 14};
const betaHeatmapLayout2 = {x: 6, y: 0, w: 6, h: 14};
const scatterLayout1 = {x: 0, y: 14, w: 6, h: 14};
const scatterLayout2 = {x: 6, y: 14, w: 6, h: 14};
const zScoreHistoryLayout1 = {x: 0, y: 28, w: 12, h: 14};
const zScoreHistoryLayout2 = {x: 0, y: 42, w: 12, h: 14};
const zScoreHistoryLayout3 = {x: 0, y: 56, w: 12, h: 14};
const priceChangePerDayOfWeek1 = {x: 0, y: 60, w: 6, h: 12};
const priceChangePerDayOfWeek2 = {x: 6, y: 72, w: 6, h: 12};
const priceChangePerHourOfDay1 = {x: 0, y: 84, w: 12, h: 12};

const ResponsiveReactGridLayout = WidthProvider(Responsive);

const Stats = () => {
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
            component: <BetaHeatmap tf="1d" timeFrameOptions={timeFrameOptions?.data?.all || []} />,
            key: 'betaHeatmap2',
        },
        {
            gridLayout: scatterLayout1,
            component: (
                <Scatter tf="4h" xAxis="price" yAxis="volume" timeFrameOptions={timeFrameOptions?.data?.all || []} />
            ),
            key: 'scatter1',
        },
        {
            gridLayout: scatterLayout2,
            component: (
                <Scatter tf="1d" xAxis="trades" yAxis="volume" timeFrameOptions={timeFrameOptions?.data?.all || []} />
            ),
            key: 'scatter2',
        },
        {
            gridLayout: zScoreHistoryLayout1,
            component: <ZScoreHistory tf="12h" type="price" timeFrameOptions={timeFrameOptions?.data?.all || []} />,
            key: 'zScoreHistory1',
        },
        {
            gridLayout: zScoreHistoryLayout2,
            component: <ZScoreHistory tf="12h" type="volume" timeFrameOptions={timeFrameOptions?.data?.all || []} />,
            key: 'zScoreHistory2',
        },
        {
            gridLayout: zScoreHistoryLayout3,
            component: <ZScoreHistory tf="12h" type="trades" timeFrameOptions={timeFrameOptions?.data?.all || []} />,
            key: 'zScoreHistory3',
        },
        {
            gridLayout: priceChangePerDayOfWeek1,
            component: (
                <PriceChangePerDayOfWeek
                    tf="1m"
                    symbol="BTCUSDT"
                    timeFrameOptions={timeFrameOptions?.data?.htf || []}
                    tickerOptions={tickerOptions?.data || []}
                    type="day"
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
                    type="day"
                />
            ),
            key: 'priceChangePerDayOfWeek2',
        },
        {
            gridLayout: priceChangePerHourOfDay1,
            component: (
                <PriceChangePerDayOfWeek
                    tf="1m"
                    symbol="BTCUSDT"
                    timeFrameOptions={timeFrameOptions?.data?.htf || []}
                    tickerOptions={tickerOptions?.data || []}
                    type="hour"
                />
            ),
            key: 'priceChangePerHourOfDay1',
        },
    ];

    return (
        <ResponsiveReactGridLayout
            cols={{lg: 12, md: 12, sm: 6, xs: 4, xxs: 2}}
            rowHeight={gridLayoutRowHeight}
            draggableHandle="#drag-handle"
        >
            {gridLayouts.map((grid) => (
                <div key={grid.key} data-grid={grid.gridLayout} className="bg-slate-900 overflow-hidden rounded">
                    {grid.component}
                </div>
            ))}
        </ResponsiveReactGridLayout>
    );
};

export default Stats;
