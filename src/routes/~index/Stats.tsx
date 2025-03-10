import {useState} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';

import {useFetchTickersOptions, useStatsSelectOptions} from './api';
import BetaHeatmap from './components/BetaHeatmap';
import PriceChangePercentage from './components/PriceChangePercentage';
import ZScoreHistory from './components/ZScoreHistory';
import Scatter from './components/ZScoreMatrix';

const CHART_HEIGHT = 14;

const ResponsiveGridLayout = WidthProvider(Responsive);

type ChartType = 'betaHeatmap' | 'scatter' | 'zScoreHistory' | 'priceChangePercentageDay' | 'priceChangePercentageHour';

interface ChartItem {
    type: ChartType;
    id: string;
}

interface ChartTemplate {
    gridLayout: {h: number; w: number; x: number; y: number};
    type: ChartType;
}

const Stats = () => {
    const timeFrameOptions = useStatsSelectOptions();
    const tickerOptions = useFetchTickersOptions();

    const chartTemplates: Record<ChartType, ChartTemplate> = {
        betaHeatmap: {
            gridLayout: {h: CHART_HEIGHT, w: 12, x: 0, y: 0},
            type: 'betaHeatmap',
        },
        scatter: {
            gridLayout: {h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT},
            type: 'scatter',
        },
        zScoreHistory: {
            gridLayout: {h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 2},
            type: 'zScoreHistory',
        },
        priceChangePercentageDay: {
            gridLayout: {h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 3},
            type: 'priceChangePercentageDay',
        },
        priceChangePercentageHour: {
            gridLayout: {h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 4},
            type: 'priceChangePercentageHour',
        },
    };

    const [chartIds, setChartIds] = useState<ChartItem[]>([
        {type: 'betaHeatmap', id: crypto.randomUUID()},
        {type: 'scatter', id: crypto.randomUUID()},
        {type: 'zScoreHistory', id: crypto.randomUUID()},
        {type: 'priceChangePercentageDay', id: crypto.randomUUID()},
        {type: 'priceChangePercentageHour', id: crypto.randomUUID()},
    ]);

    const addChart = (type: ChartType) => {
        const clickedChartIndex = chartIds.findIndex((chart) => chart.type === type);

        setChartIds((prev) => [
            ...prev.slice(0, clickedChartIndex + 1),
            {type, id: crypto.randomUUID()},
            ...prev.slice(clickedChartIndex + 1),
        ]);
    };

    const removeChart = (id: string, type: ChartType) => {
        if (chartIds.filter((chart) => chart.type === type).length === 1) return;
        setChartIds((prev) => prev.filter((chart) => chart.id !== id));
    };

    const gridLayouts = chartIds.map((chart, index) => {
        const template = chartTemplates[chart.type];
        const gridLayout = {
            ...template.gridLayout,
            y: index * CHART_HEIGHT,
        };

        let component;
        switch (chart.type) {
            case 'betaHeatmap':
                component = (
                    <BetaHeatmap
                        tf="4h"
                        timeFrameOptions={timeFrameOptions.data?.all || []}
                        onAddClick={() => addChart('betaHeatmap')}
                        onRemoveClick={() => removeChart(chart.id, 'betaHeatmap')}
                    />
                );
                break;
            case 'scatter':
                component = (
                    <Scatter
                        tf="4h"
                        timeFrameOptions={timeFrameOptions.data?.all || []}
                        xAxis="price"
                        yAxis="volume"
                        onAddClick={() => addChart('scatter')}
                        onRemoveClick={() => removeChart(chart.id, 'scatter')}
                    />
                );
                break;
            case 'zScoreHistory':
                component = (
                    <ZScoreHistory
                        tf="12h"
                        onAddClick={() => addChart('zScoreHistory')}
                        onRemoveClick={() => removeChart(chart.id, 'zScoreHistory')}
                    />
                );
                break;
            case 'priceChangePercentageDay':
                component = (
                    <PriceChangePercentage
                        symbol="BTCUSDT"
                        tf="1m"
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.htf || []}
                        type="day"
                        onAddClick={() => addChart('priceChangePercentageDay')}
                        onRemoveClick={() => removeChart(chart.id, 'priceChangePercentageDay')}
                    />
                );
                break;
            case 'priceChangePercentageHour':
                component = (
                    <PriceChangePercentage
                        symbol="BTCUSDT"
                        tf="1m"
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.htf || []}
                        type="hour"
                        onAddClick={() => addChart('priceChangePercentageHour')}
                        onRemoveClick={() => removeChart(chart.id, 'priceChangePercentageHour')}
                    />
                );
                break;
        }

        return {
            component,
            gridLayout,
            key: `${chart.type} ${chart.id}`,
        };
    });

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
