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
                        timeFrameOptions={timeFrameOptions?.data?.all || []}
                        xAxis="price"
                        yAxis="volume"
                    />
                ),
                key: 'scatter1',
            },
            {
                gridLayout: {w: 6, h: 14, x: 6, y: 14},
                component: (
                    <Scatter
                        tf="1d"
                        timeFrameOptions={timeFrameOptions?.data?.all || []}
                        xAxis="trades"
                        yAxis="volume"
                    />
                ),
                key: 'scatter2',
            },
            {
                gridLayout: {w: 12, h: 14, x: 0, y: 28},
                component: <ZScoreHistory tf="12h" timeFrameOptions={timeFrameOptions?.data?.all || []} type="price" />,
                key: 'zScoreHistory1',
            },
            {
                gridLayout: {w: 12, h: 14, x: 0, y: 42},
                component: (
                    <ZScoreHistory tf="12h" timeFrameOptions={timeFrameOptions?.data?.all || []} type="volume" />
                ),
                key: 'zScoreHistory2',
            },
            {
                gridLayout: {w: 12, h: 14, x: 0, y: 56},
                component: (
                    <ZScoreHistory tf="12h" timeFrameOptions={timeFrameOptions?.data?.all || []} type="trades" />
                ),
                key: 'zScoreHistory3',
            },
            {
                gridLayout: {w: 6, h: 14, x: 0, y: 60},
                component: (
                    <PriceChangePerDayOfWeek
                        symbol="BTCUSDT"
                        tf="1m"
                        tickerOptions={tickerOptions?.data || []}
                        timeFrameOptions={timeFrameOptions?.data?.htf || []}
                        type="day"
                    />
                ),
                key: 'priceChangePerDayOfWeek1',
            },
            {
                gridLayout: {w: 6, h: 14, x: 6, y: 60},
                component: (
                    <PriceChangePerDayOfWeek
                        symbol="ETHUSDT"
                        tf="1m"
                        tickerOptions={tickerOptions?.data || []}
                        timeFrameOptions={timeFrameOptions?.data?.htf || []}
                        type="day"
                    />
                ),
                key: 'priceChangePerDayOfWeek2',
            },
            {
                gridLayout: {w: 12, h: 14, x: 0, y: 74},
                component: (
                    <PriceChangePerDayOfWeek
                        symbol="BTCUSDT"
                        tf="1m"
                        tickerOptions={tickerOptions?.data || []}
                        timeFrameOptions={timeFrameOptions?.data?.htf || []}
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
            draggableHandle="#drag-handle"
            rowHeight={gridLayoutRowHeight}
            onLayoutChange={(_, layouts) => setLayouts(layouts)}
            layouts={layouts}
            // onBreakpointChange={(newBreakpoint) => setBreakpoint(newBreakpoint)}
        >
            {gridLayouts.map((grid) => (
                <div className="bg-slate-900 overflow-hidden rounded" data-grid={grid.gridLayout} key={grid.key}>
                    {grid.component}
                </div>
            ))}
        </ResponsiveGridLayout>
    );
}
