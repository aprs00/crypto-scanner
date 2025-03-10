import {useMemo} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';

import {useFetchTickersOptions, useStatsSelectOptions} from './api';
import BetaHeatmap from './components/BetaHeatmap';
import PriceChangePercentage from './components/PriceChangePercentage';
import ZScoreHistory from './components/ZScoreHistory';
import Scatter from './components/ZScoreMatrix';

const ResponsiveGridLayout = WidthProvider(Responsive);

const Stats = () => {
    const timeFrameOptions = useStatsSelectOptions();
    const tickerOptions = useFetchTickersOptions();

    const gridLayouts = useMemo(
        () => [
            {
                component: <BetaHeatmap tf="4h" timeFrameOptions={timeFrameOptions.data?.all || []} />,
                gridLayout: {h: 14, w: 12, x: 0, y: 0},
                key: '1',
            },
            {
                component: (
                    <Scatter tf="4h" timeFrameOptions={timeFrameOptions.data?.all || []} xAxis="price" yAxis="volume" />
                ),
                gridLayout: {h: 14, w: 12, x: 0, y: 14},
                key: '2',
            },
            {
                component: <ZScoreHistory tf="12h" />,
                gridLayout: {h: 14, w: 12, x: 0, y: 28},
                key: '3',
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
                gridLayout: {h: 14, w: 12, x: 0, y: 42},
                key: '4',
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
                gridLayout: {h: 14, w: 12, x: 0, y: 66},
                key: '5',
            },
        ],
        [timeFrameOptions.data, tickerOptions.data],
    );

    return (
        <ResponsiveGridLayout
            cols={{lg: 12, md: 12, sm: 6, xs: 6, xxs: 6}}
            draggableHandle="#drag-handle"
            rowHeight={30}
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
