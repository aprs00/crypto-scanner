import {useMemo} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';

import {useFetchTickersOptions, useStatsSelectOptions} from './api';
import BetaHeatmap from './components/BetaHeatmap';
import PriceChangePercentage from './components/PriceChangePercentage';
import ZScoreHistory from './components/ZScoreHistory';
import Scatter from './components/ZScoreMatrix';

const gridLayoutRowHeight = 30;

const ResponsiveGridLayout = WidthProvider(Responsive) as any;

const Stats = () => {
    const timeFrameOptions = useStatsSelectOptions();
    const tickerOptions = useFetchTickersOptions();

    const gridLayouts = useMemo(
        () => [
            {
                component: <BetaHeatmap tf="4h" timeFrameOptions={timeFrameOptions.data?.all || []} />,
                gridLayout: {h: 14, w: 6, x: 0, y: 0},
                key: 'betaHeatmap1',
            },
            {
                component: <BetaHeatmap tf="1d" timeFrameOptions={timeFrameOptions.data?.all || []} />,
                gridLayout: {h: 14, w: 6, x: 6, y: 0},
                key: 'betaHeatmap2',
            },
            {
                component: (
                    <Scatter tf="4h" timeFrameOptions={timeFrameOptions.data?.all || []} xAxis="price" yAxis="volume" />
                ),
                gridLayout: {h: 14, w: 6, x: 0, y: 14},
                key: 'scatter1',
            },
            {
                component: (
                    <Scatter
                        tf="1d"
                        timeFrameOptions={timeFrameOptions.data?.all || []}
                        xAxis="trades"
                        yAxis="volume"
                    />
                ),
                gridLayout: {h: 14, w: 6, x: 6, y: 14},
                key: 'scatter2',
            },
            {
                component: <ZScoreHistory tf="12h" timeFrameOptions={timeFrameOptions.data?.all || []} type="price" />,
                gridLayout: {h: 14, w: 12, x: 0, y: 28},
                key: 'zScoreHistory1',
            },
            {
                component: <ZScoreHistory tf="12h" timeFrameOptions={timeFrameOptions.data?.all || []} type="volume" />,
                gridLayout: {h: 14, w: 12, x: 0, y: 42},
                key: 'zScoreHistory2',
            },
            {
                component: <ZScoreHistory tf="12h" timeFrameOptions={timeFrameOptions.data?.all || []} type="trades" />,
                gridLayout: {h: 14, w: 12, x: 0, y: 56},
                key: 'zScoreHistory3',
            },
            {
                component: (
                    <PriceChangePercentage
                        symbol="BTCUSDT"
                        tf="1m"
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.htf || []}
                        type="day"
                    />
                ),
                gridLayout: {h: 14, w: 6, x: 0, y: 60},
                key: 'priceChangePerDayOfWeek1',
            },
            {
                component: (
                    <PriceChangePercentage
                        symbol="ETHUSDT"
                        tf="1m"
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.htf || []}
                        type="day"
                    />
                ),
                gridLayout: {h: 14, w: 6, x: 6, y: 60},
                key: 'priceChangePerDayOfWeek2',
            },
            {
                component: (
                    <PriceChangePercentage
                        symbol="BTCUSDT"
                        tf="1m"
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.htf || []}
                        type="hour"
                    />
                ),
                gridLayout: {h: 14, w: 12, x: 0, y: 74},
                key: 'priceChangePerHourOfDay1',
            },
        ],
        [timeFrameOptions, tickerOptions],
    );

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

export default Stats;
