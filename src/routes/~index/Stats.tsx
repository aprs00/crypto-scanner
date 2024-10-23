import {useMemo, useState} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSScatter from '@/components/Charts/CSScatter';

import {useFetchTickersOptions, useStatsSelectOptions, useZScoreMatrix} from './api';
import BetaHeatmap from './components/BetaHeatmap';
import PriceChangePercentage from './components/PriceChangePercentage';
import ZScoreHistory from './components/ZScoreHistory';

const gridLayoutRowHeight = 30;

const ResponsiveGridLayout = WidthProvider(Responsive);

const Stats = () => {
    const [selectedTfZScoreMatrix1, setSelectedTfZScoreMatrix1] = useState('4h');
    const [selectedTfZScoreMatrix2, setSelectedTfZScoreMatrix2] = useState('1d');

    const timeFrameOptions = useStatsSelectOptions();
    const tickerOptions = useFetchTickersOptions();
    const zScoreMatrix1 = useZScoreMatrix('trades', 'volume', selectedTfZScoreMatrix1);
    const zScoreMatrix2 = useZScoreMatrix('trades', 'volume', selectedTfZScoreMatrix2);

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
                    <ChartContainer
                        body={<CSScatter data={zScoreMatrix1.data || []} xAxis="trades" yAxis="volume" />}
                        selects={[
                            {
                                componentName: 'select',
                                id: '1',
                                onChange: setSelectedTfZScoreMatrix1,
                                options: timeFrameOptions.data?.all || [],
                                value: selectedTfZScoreMatrix1,
                            },
                        ]}
                        title="Z Score"
                    />
                ),
                gridLayout: {h: 14, w: 6, x: 0, y: 14},
                key: 'scatter1',
            },
            {
                component: (
                    <ChartContainer
                        body={<CSScatter data={zScoreMatrix2.data || []} xAxis="trades" yAxis="volume" />}
                        selects={[
                            {
                                componentName: 'select',
                                id: '1',
                                onChange: setSelectedTfZScoreMatrix2,
                                options: timeFrameOptions.data?.all || [],
                                value: selectedTfZScoreMatrix2,
                            },
                        ]}
                        title="Z Score"
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
