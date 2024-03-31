import {createFileRoute} from '@tanstack/react-router';
import {useMemo, useState} from 'react';
import type {Layouts} from 'react-grid-layout';
import {Responsive, WidthProvider} from 'react-grid-layout';

import {useFetchTickersOptions, useStatsSelectOptions} from './api';
import BetaHeatmap from './components/BetaHeatmap';
import PriceChangePerDayOfWeek from './components/PriceChangePercentage';
import ZScoreHistory from './components/ZScoreHistory';
import Scatter from './components/ZScoreMatrix';

const gridLayoutRowHeight = 30;

const ResponsiveGridLayout = WidthProvider(Responsive);

export const Route = createFileRoute('/')({
    component: Stats,
});

function Stats() {
    const timeFrameOptions = useStatsSelectOptions();
    const tickerOptions = useFetchTickersOptions();

    const [layouts, setLayouts] = useState<Layouts>();
    // const [breakpoint, setBreakpoint] = useState('lg');

    const gridLayouts = useMemo(
        () => [
            {
                gridLayout: {w: 6, h: 14, x: 0, y: 0},
                component: <BetaHeatmap tf="4h" timeFrameOptions={timeFrameOptions?.data?.all || []} />,
                key: 'betaHeatmap1',
            },
            {
                gridLayout: {w: 6, h: 14, x: 6, y: 0},
                component: <BetaHeatmap tf="1d" timeFrameOptions={timeFrameOptions?.data?.all || []} />,
                key: 'betaHeatmap2',
            },
            {
                gridLayout: {w: 6, h: 14, x: 0, y: 14},
                component: (
                    <Scatter
                        tf="4h"
                        xAxis="price"
                        yAxis="volume"
                        timeFrameOptions={timeFrameOptions?.data?.all || []}
                    />
                ),
                key: 'scatter1',
            },
            {
                gridLayout: {w: 6, h: 14, x: 6, y: 14},
                component: (
                    <Scatter
                        tf="1d"
                        xAxis="trades"
                        yAxis="volume"
                        timeFrameOptions={timeFrameOptions?.data?.all || []}
                    />
                ),
                key: 'scatter2',
            },
            {
                gridLayout: {w: 12, h: 14, x: 0, y: 28},
                component: <ZScoreHistory tf="12h" type="price" timeFrameOptions={timeFrameOptions?.data?.all || []} />,
                key: 'zScoreHistory1',
            },
            {
                gridLayout: {w: 12, h: 14, x: 0, y: 42},
                component: (
                    <ZScoreHistory tf="12h" type="volume" timeFrameOptions={timeFrameOptions?.data?.all || []} />
                ),
                key: 'zScoreHistory2',
            },
            {
                gridLayout: {w: 12, h: 14, x: 0, y: 56},
                component: (
                    <ZScoreHistory tf="12h" type="trades" timeFrameOptions={timeFrameOptions?.data?.all || []} />
                ),
                key: 'zScoreHistory3',
            },
            {
                gridLayout: {w: 6, h: 14, x: 0, y: 60},
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
                gridLayout: {w: 6, h: 14, x: 6, y: 60},
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
                gridLayout: {w: 12, h: 14, x: 0, y: 74},
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
        ],
        [timeFrameOptions, tickerOptions],
    );

    return (
        <ResponsiveGridLayout
            cols={{lg: 12, md: 12, sm: 6, xs: 6, xxs: 6}}
            rowHeight={gridLayoutRowHeight}
            draggableHandle="#drag-handle"
            onLayoutChange={(_, layouts) => setLayouts(layouts)}
            layouts={layouts}
            // onBreakpointChange={(newBreakpoint) => setBreakpoint(newBreakpoint)}
        >
            {gridLayouts.map((grid) => (
                <div key={grid.key} data-grid={grid.gridLayout} className="bg-slate-900 overflow-hidden rounded">
                    {grid.component}
                </div>
            ))}
        </ResponsiveGridLayout>
    );
}
