import { Responsive, WidthProvider } from 'react-grid-layout';

import type { ChartTemplate, ChartType } from './types';

import { useFetchTickersOptions, useStatsSelectOptions, useCorrelationTypeOptions } from './api';
import BetaHeatmap from './components/BetaHeatmap';
import PriceChangePercentage from './components/PriceChangePercentage';
import ZScoreHeatmap from './components/ZScoreHeatmap';
import ZScoreHistory from './components/ZScoreHistory';
import Scatter from './components/ZScoreMatrix';
import useChartStore from './useChartStore';

const CHART_HEIGHT = 25;

const ResponsiveGridLayout = WidthProvider(Responsive);

const Stats = () => {
    const timeFrameOptions = useStatsSelectOptions();
    const tickerOptions = useFetchTickersOptions();
    const typeOptions = useCorrelationTypeOptions();

    const chartIds = useChartStore((state) => state.chartIds);
    const savedGridLayouts = useChartStore((state) => state.savedGridLayouts);
    const { addChart, removeChart, handleLayoutChange, updateChartConfig } = useChartStore();

    const chartTemplates: Record<ChartType, ChartTemplate> = {
        betaHeatmap: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: 0, i: '1' },
            type: 'betaHeatmap',
        },
        scatter: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT, i: '2' },
            type: 'scatter',
        },
        zScoreHistory: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 2, i: '3' },
            type: 'zScoreHistory',
        },
        zScoreHeatmap: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: 0, i: '4' },
            type: 'zScoreHeatmap',
        },
        priceChangePercentageDay: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 3, i: '5' },
            type: 'priceChangePercentageDay',
        },
        priceChangePercentageHour: {
            gridLayout: { h: CHART_HEIGHT, w: 12, x: 0, y: CHART_HEIGHT * 4, i: '6' },
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
                        timeFrameOptions={timeFrameOptions.data?.correlation || []}
                        type={savedLayout.type || 'price'}
                        typeOptions={typeOptions.data || []}
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
                        timeFrameOptions={timeFrameOptions.data?.zscore || []}
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
                        typeOptions={typeOptions.data || []}
                    />
                );
                break;
            case 'zScoreHeatmap':
                component = (
                    <ZScoreHeatmap
                        onAddClick={() => addChart('zScoreHeatmap')}
                        onConfigChange={(config) => updateChartConfig(chartKey, config)}
                        onRemoveClick={() => removeChart(chart.id, 'zScoreHeatmap')}
                        tf={savedLayout.tf || '4h'}
                        timeFrameOptions={timeFrameOptions.data?.zscore_heatmap || []}
                        type="price"
                        typeOptions={typeOptions.data || []}
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
                        tf={savedLayout.tf || '1M'}
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.average_price || []}
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
                        tf={savedLayout.tf || '1M'}
                        tickerOptions={tickerOptions.data || []}
                        timeFrameOptions={timeFrameOptions.data?.average_price || []}
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
            cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
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
