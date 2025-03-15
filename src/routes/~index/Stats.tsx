import { Responsive, WidthProvider } from 'react-grid-layout';

import type { ChartTemplate, ChartType } from './types';

import { useFetchTickersOptions, useStatsSelectOptions } from './api';
import BetaHeatmap from './components/BetaHeatmap';
import PriceChangePercentage from './components/PriceChangePercentage';
import ZScoreHistory from './components/ZScoreHistory';
import Scatter from './components/ZScoreMatrix';
import useChartStore from './useChartStore';

const CHART_HEIGHT = 14;

const ResponsiveGridLayout = WidthProvider(Responsive);

const Stats = () => {
    const timeFrameOptions = useStatsSelectOptions();
    const tickerOptions = useFetchTickersOptions();

    const chartIds = useChartStore((state) => state.chartIds);
    const savedGridLayouts = useChartStore((state) => state.savedGridLayouts);
    const { addChart, removeChart, handleLayoutChange, updateChartConfig } = useChartStore();

    const chartTemplates: Record<ChartType, ChartTemplate> = {
        betaHeatmap: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: 0 },
            type: 'betaHeatmap',
        },
        scatter: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT },
            type: 'scatter',
        },
        zScoreHistory: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 2 },
            type: 'zScoreHistory',
        },
        priceChangePercentageDay: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 3 },
            type: 'priceChangePercentageDay',
        },
        priceChangePercentageHour: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 4 },
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
                        onAddClick={() => addChart('betaHeatmap')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'betaHeatmap')}
                        tf={savedLayout.tf || '4h'}
                        timeFrameOptions={timeFrameOptions.data?.all || []}
                    />
                );
                break;
            case 'scatter':
                component = (
                    <Scatter
                        onAddClick={() => addChart('scatter')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'scatter')}
                        tf={savedLayout.tf || '4h'}
                        timeFrameOptions={timeFrameOptions.data?.all || []}
                        xAxis={savedLayout.xAxis || 'price'}
                        yAxis={savedLayout.yAxis || 'volume'}
                    />
                );
                break;
            case 'zScoreHistory':
                component = (
                    <ZScoreHistory
                        onAddClick={() => addChart('zScoreHistory')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'zScoreHistory')}
                        type={savedLayout.type || 'price'}
                    />
                );
                break;
            case 'priceChangePercentageDay':
                component = (
                    <PriceChangePercentage
                        onAddClick={() => addChart('priceChangePercentageDay')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'priceChangePercentageDay')}
                        symbol={savedLayout.symbol || 'BTCUSDT'}
                        tf={savedLayout.tf || '1m'}
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.htf || []}
                        type="day"
                    />
                );
                break;
            case 'priceChangePercentageHour':
                component = (
                    <PriceChangePercentage
                        onAddClick={() => addChart('priceChangePercentageHour')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'priceChangePercentageHour')}
                        symbol={savedLayout.symbol || 'BTCUSDT'}
                        tf={savedLayout.tf || '1m'}
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.htf || []}
                        type="hour"
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
            cols={{ lg: 12, md: 12, sm: 6, xs: 6, xxs: 6 }}
            draggableHandle="#drag-handle"
            onLayoutChange={handleLayoutChange}
            rowHeight={30}
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
