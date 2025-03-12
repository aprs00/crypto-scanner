import {Responsive, WidthProvider} from 'react-grid-layout';

import {useFetchTickersOptions, useStatsSelectOptions} from './api';
import BetaHeatmap from './components/BetaHeatmap';
import PriceChangePercentage from './components/PriceChangePercentage';
import ZScoreHistory from './components/ZScoreHistory';
import Scatter from './components/ZScoreMatrix';
import type {ChartTemplate, ChartType} from './types';
import useChartStore from './useChartStore';

const CHART_HEIGHT = 14;

const ResponsiveGridLayout = WidthProvider(Responsive);

const Stats = () => {
    const timeFrameOptions = useStatsSelectOptions();
    const tickerOptions = useFetchTickersOptions();

    const chartIds = useChartStore((state) => state.chartIds);
    const savedGridLayouts = useChartStore((state) => state.savedGridLayouts);
    const {addChart, removeChart, handleLayoutChange, updateChartConfig} = useChartStore();

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

    const gridLayouts = chartIds.map((chart, index) => {
        const template = chartTemplates[chart.type];
        const chartKey = `${chart.type} ${chart.id}`;
        const savedLayout = savedGridLayouts[chartKey] || {};

        const gridLayout = {
            ...template.gridLayout,
            ...savedLayout?.layout,
            y: index * CHART_HEIGHT,
        };

        let component;
        switch (chart.type) {
            case 'betaHeatmap':
                component = (
                    <BetaHeatmap
                        tf={savedLayout.tf || '4h'}
                        timeFrameOptions={timeFrameOptions.data?.all || []}
                        onAddClick={() => addChart('betaHeatmap')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'betaHeatmap')}
                    />
                );
                break;
            case 'scatter':
                component = (
                    <Scatter
                        tf={savedLayout.tf || '4h'}
                        timeFrameOptions={timeFrameOptions.data?.all || []}
                        xAxis={savedLayout.xAxis || 'price'}
                        yAxis={savedLayout.yAxis || 'volume'}
                        onAddClick={() => addChart('scatter')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'scatter')}
                    />
                );
                break;
            case 'zScoreHistory':
                component = (
                    <ZScoreHistory
                        type={savedLayout.type || 'price'}
                        onAddClick={() => addChart('zScoreHistory')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'zScoreHistory')}
                    />
                );
                break;
            case 'priceChangePercentageDay':
                component = (
                    <PriceChangePercentage
                        symbol={savedLayout.symbol || 'BTCUSDT'}
                        tf={savedLayout.tf || '1m'}
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.htf || []}
                        type="day"
                        onAddClick={() => addChart('priceChangePercentageDay')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'priceChangePercentageDay')}
                    />
                );
                break;
            case 'priceChangePercentageHour':
                component = (
                    <PriceChangePercentage
                        symbol={savedLayout.symbol || 'BTCUSDT'}
                        tf={savedLayout.tf || '1m'}
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.htf || []}
                        type="hour"
                        onAddClick={() => addChart('priceChangePercentageHour')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'priceChangePercentageHour')}
                    />
                );
                break;
        }

        return {
            component,
            gridLayout,
            key: chartKey,
        };
    });

    return (
        <ResponsiveGridLayout
            cols={{lg: 12, md: 12, sm: 6, xs: 6, xxs: 6}}
            draggableHandle="#drag-handle"
            rowHeight={30}
            onLayoutChange={handleLayoutChange}
        >
            {gridLayouts.map((grid) => (
                <div className="bg-slate-900 overflow-hidden rounded-sm" data-grid={grid.gridLayout} key={grid.key}>
                    {grid.component}
                </div>
            ))}
        </ResponsiveGridLayout>
    );
};

export default Stats;
