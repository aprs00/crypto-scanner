import { useMemo, memo } from 'react';

import type { ChartConfig, ChartItem, GridLayout } from '../types';

import { useFetchTickersOptions, useStatsSelectOptions, useCorrelationTypeOptions } from '../api';
import useChartStore from '../useChartStore';
import BetaHeatmap from './BetaHeatmap';
import PriceChangePercentage from './PriceChangePercentage';
import ZScoreHeatmap from './ZScoreHeatmap';
import ZScoreHistory from './ZScoreHistory';
import Scatter from './ZScoreMatrix';

const ChartWrapper = ({ chart, savedLayout }: { chart: ChartItem; savedLayout: GridLayout }) => {
    const timeFrameOptions = useStatsSelectOptions();
    const tickerOptions = useFetchTickersOptions();
    const typeOptions = useCorrelationTypeOptions();

    const addChart = useChartStore((state) => state.addChart);
    const removeChart = useChartStore((state) => state.removeChart);
    const updateChartConfig = useChartStore((state) => state.updateChartConfig);

    const commonProps = useMemo(
        () => ({
            onAddClick: () => addChart(chart.type),
            onConfigChange: (config: ChartConfig) => updateChartConfig(chart.id, config),
            onRemoveClick: () => removeChart(chart.id, chart.type),
        }),
        [addChart, updateChartConfig, removeChart, chart.type, chart.id],
    );

    switch (chart.type) {
        case 'betaHeatmap':
            return (
                <BetaHeatmap
                    {...commonProps}
                    hours={savedLayout.hours || '4'}
                    hoursOptions={timeFrameOptions.data?.correlation || {}}
                    type={savedLayout.type || 'price'}
                    typeOptions={typeOptions.data || []}
                />
            );
        case 'scatter':
            return (
                <Scatter
                    {...commonProps}
                    hours={savedLayout.hours || '4'}
                    hoursOptions={timeFrameOptions.data?.zscore || {}}
                    xAxis={savedLayout.xAxis || 'price'}
                    yAxis={savedLayout.yAxis || 'volume'}
                />
            );
        case 'zScoreHistory':
            return (
                <ZScoreHistory
                    {...commonProps}
                    hoursOptions={typeOptions.data || []}
                    type={savedLayout.type || 'price'}
                />
            );
        case 'zScoreHeatmap':
            return (
                <ZScoreHeatmap
                    {...commonProps}
                    hours={savedLayout.hours || '4h'}
                    hoursOptions={timeFrameOptions.data?.zscore || {}}
                    type="price"
                    typeOptions={typeOptions.data || []}
                />
            );
        case 'priceChangePercentageDay':
            return (
                <PriceChangePercentage
                    {...commonProps}
                    hours={savedLayout.hours || '1M'}
                    symbol={savedLayout.symbol || 'BTCUSDT'}
                    tickerOptions={tickerOptions.data || []}
                    timeFrameOptions={timeFrameOptions.data?.average_price || {}}
                    type="day"
                />
            );
        case 'priceChangePercentageHour':
            return (
                <PriceChangePercentage
                    {...commonProps}
                    hours={savedLayout.hours || '1M'}
                    symbol={savedLayout.symbol || 'BTCUSDT'}
                    tickerOptions={tickerOptions.data || []}
                    timeFrameOptions={timeFrameOptions.data?.average_price || {}}
                    type="hour"
                />
            );
        default:
            return null;
    }
};

export default memo(ChartWrapper);
