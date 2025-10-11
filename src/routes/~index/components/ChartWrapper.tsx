import { useBootstrap } from '../api';
import { ChartType, type ChartConfig, type ChartItem, type GridLayout } from '../types';
import useChartStore from '../useChartStore';
import BetaHeatmap from './BetaHeatmap';
import CorrelationPairHistory from './CorrelationPairHistory';
import PriceChangePercentage from './PriceChangePercentage';
import ZScoreHeatmap from './ZScoreHeatmap';
import ZScoreHistory from './ZScoreHistory';
import Scatter from './ZScoreScatter';

const ChartWrapper = ({ chart, savedLayout }: { chart: ChartItem; savedLayout: GridLayout }) => {
    const bootstrap = useBootstrap();

    const chartIds = useChartStore((state) => state.chartIds);
    const addChart = useChartStore((state) => state.addChart);
    const removeChart = useChartStore((state) => state.removeChart);
    const updateChartConfig = useChartStore((state) => state.updateChartConfig);

    const canRemove = chartIds.filter((c) => c.type === chart.type).length > 1;

    const commonProps = {
        onAddClick: () => addChart(chart.type),
        onConfigChange: (config: ChartConfig) => updateChartConfig(chart.id, config),
        onRemoveClick: canRemove ? () => removeChart(chart.id, chart.type) : undefined,
    };

    switch (chart.type) {
        case ChartType.BetaHeatmap:
            return (
                <BetaHeatmap
                    {...commonProps}
                    hours={savedLayout.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options.correlation || {}}
                    type={savedLayout.type || 'price'}
                    typeOptions={bootstrap.data?.data_types || []}
                />
            );
        case ChartType.Scatter:
            return (
                <Scatter
                    {...commonProps}
                    hours={savedLayout.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options.zscore || {}}
                    xAxis={savedLayout.xAxis || 'price'}
                    yAxis={savedLayout.yAxis || 'volume'}
                />
            );
        case ChartType.ZScoreHistory:
            return (
                <ZScoreHistory
                    {...commonProps}
                    hoursOptions={bootstrap.data?.hours_options.zscore || {}}
                    type={savedLayout.type || 'price'}
                />
            );
        case ChartType.ZScoreHeatmap:
            return (
                <ZScoreHeatmap
                    {...commonProps}
                    hours={savedLayout.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options.zscore || {}}
                    type="price"
                    typeOptions={bootstrap.data?.data_types || []}
                />
            );
        case ChartType.PriceChangePercentageDay:
            return (
                <PriceChangePercentage
                    {...commonProps}
                    hours={savedLayout.hours || '168'}
                    symbol={savedLayout.symbol || 'BTCUSDT'}
                    symbolOptions={bootstrap.data?.symbols || []}
                    timeFrameOptions={bootstrap.data?.hours_options.average_price || {}}
                    type="day"
                />
            );
        case ChartType.PriceChangePercentageHour:
            return (
                <PriceChangePercentage
                    {...commonProps}
                    hours={savedLayout.hours || '168'}
                    symbol={savedLayout.symbol || 'BTCUSDT'}
                    symbolOptions={bootstrap.data?.symbols || []}
                    timeFrameOptions={bootstrap.data?.hours_options.average_price || {}}
                    type="hour"
                />
            );
        case ChartType.CorrelationPairHistory:
            return (
                <CorrelationPairHistory
                    {...commonProps}
                    hours={savedLayout.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options.correlation || {}}
                    symbol1={savedLayout.symbol1 || 'BTCUSDT'}
                    symbol2={savedLayout.symbol2 || 'SOLUSDT'}
                    symbolOptions={bootstrap.data?.symbols || []}
                    type={savedLayout.type || 'price'}
                    typeOptions={bootstrap.data?.data_types || []}
                />
            );
        default:
            return null;
    }
};

export default ChartWrapper;
