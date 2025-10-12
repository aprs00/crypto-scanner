import { useBootstrap } from '../api';
import {
    ChartType,
    DataType,
    HoursOptionCategory,
    TimePeriodType,
    type ChartConfig,
    type ChartItem,
    type GridLayout,
} from '../types';
import useChartStore from '../useChartStore';
import BetaHeatmap from './BetaHeatmap';
import CorrelationPairHistory from './CorrelationPairHistory';
import PriceChangePercentage from './PriceChangePercentage';
import ZScoreHeatmap from './ZScoreHeatmap';
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
                    dataType={savedLayout.type || DataType.Price}
                    hours={savedLayout.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options[HoursOptionCategory.Correlation] || {}}
                    typeOptions={bootstrap.data?.data_types || []}
                />
            );
        case ChartType.Scatter:
            return (
                <Scatter
                    {...commonProps}
                    hours={savedLayout.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options[HoursOptionCategory.ZScore] || {}}
                    xAxis={savedLayout.xAxis || DataType.Price}
                    yAxis={savedLayout.yAxis || DataType.Volume}
                />
            );
        case ChartType.ZScoreHeatmap:
            return (
                <ZScoreHeatmap
                    {...commonProps}
                    dataType={savedLayout.type || DataType.Price}
                    hours={savedLayout.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options[HoursOptionCategory.ZScore] || {}}
                    typeOptions={bootstrap.data?.data_types || []}
                />
            );
        case ChartType.PriceChangePercentageDay:
            return (
                <PriceChangePercentage
                    {...commonProps}
                    hours={savedLayout.hours || '168'}
                    periodType={TimePeriodType.Day}
                    symbol={savedLayout.symbol || 'BTCUSDT'}
                    symbolOptions={bootstrap.data?.symbols || []}
                    timeFrameOptions={bootstrap.data?.hours_options[HoursOptionCategory.AveragePrice] || {}}
                />
            );
        case ChartType.PriceChangePercentageHour:
            return (
                <PriceChangePercentage
                    {...commonProps}
                    hours={savedLayout.hours || '168'}
                    periodType={TimePeriodType.Hour}
                    symbol={savedLayout.symbol || 'BTCUSDT'}
                    symbolOptions={bootstrap.data?.symbols || []}
                    timeFrameOptions={bootstrap.data?.hours_options[HoursOptionCategory.AveragePrice] || {}}
                />
            );
        case ChartType.CorrelationPairHistory:
            return (
                <CorrelationPairHistory
                    {...commonProps}
                    dataType={savedLayout.type || DataType.Price}
                    hours={savedLayout.hours || '1'}
                    hoursOptions={bootstrap.data?.hours_options[HoursOptionCategory.CorrelationPair] || {}}
                    symbol1={savedLayout.symbol1 || 'BTCUSDT'}
                    symbol2={savedLayout.symbol2 || 'SOLUSDT'}
                    symbolOptions={bootstrap.data?.symbols || []}
                    typeOptions={bootstrap.data?.data_types || []}
                />
            );
    }
};

export default ChartWrapper;
