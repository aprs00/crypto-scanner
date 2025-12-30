import { useBootstrap } from '../api';
import {
    ChartType,
    ContractType,
    DataType,
    Exchange,
    HoursOptionCategory,
    TimePeriodType,
    type ChartItem,
    type ExchangeChartConfig,
    type GridLayout,
} from '../types';
import useChartStore from '../useChartStore';
import BetaHeatmap from './BetaHeatmap';
import CorrelationPairHistory from './CorrelationPairHistory';
import PriceChangePercentage from './PriceChangePercentage';
import ZScoreHeatmap from './ZScoreHeatmap';
import Scatter from './ZScoreScatter';
import Scatter3D from './ZScoreScatter3D';

const ChartWrapper = ({ chart, savedLayout }: { chart: ChartItem; savedLayout: GridLayout }) => {
    const exchange = savedLayout.exchange || Exchange.Binance;
    const contractType = ContractType.Perpetual;

    const exchangeConfig = savedLayout.exchangeConfigs?.[exchange] || {};

    const bootstrap = useBootstrap({ exchange, contractType });
    const chartDefaults = bootstrap.data?.chart_defaults;

    const chartIds = useChartStore((state) => state.chartIds);
    const addChart = useChartStore((state) => state.addChart);
    const removeChart = useChartStore((state) => state.removeChart);
    const setChartExchange = useChartStore((state) => state.setChartExchange);
    const updateExchangeConfig = useChartStore((state) => state.updateExchangeConfig);

    const canRemove = chartIds.filter((c) => c.type === chart.type).length > 1;

    const commonProps = {
        exchange,
        contractType,
        onAddClick: () => addChart(chart.type),
        onExchangeChange: (newExchange: Exchange) => setChartExchange(chart.id, newExchange),
        onConfigChange: (config: ExchangeChartConfig) => updateExchangeConfig(chart.id, exchange, config),
        onRemoveClick: canRemove ? () => removeChart(chart.id, chart.type) : undefined,
    };

    switch (chart.type) {
        case ChartType.BetaHeatmap:
            return (
                <BetaHeatmap
                    {...commonProps}
                    dataType={exchangeConfig.dataType || DataType.Price}
                    hours={exchangeConfig.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options[HoursOptionCategory.Correlation] || {}}
                    symbolOptions={bootstrap.data?.symbols || []}
                    symbols={exchangeConfig.symbols ?? chartDefaults?.heatmap.symbols ?? []}
                    typeOptions={bootstrap.data?.data_types || []}
                />
            );
        case ChartType.Scatter:
            return (
                <Scatter
                    {...commonProps}
                    hours={exchangeConfig.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options[HoursOptionCategory.ZScore] || {}}
                    xAxis={exchangeConfig.xAxis || DataType.Price}
                    yAxis={exchangeConfig.yAxis || DataType.Volume}
                />
            );
        case ChartType.Scatter3D:
            return (
                <Scatter3D
                    {...commonProps}
                    hours={exchangeConfig.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options[HoursOptionCategory.ZScore] || {}}
                    xAxis={exchangeConfig.xAxis || DataType.Price}
                    yAxis={exchangeConfig.yAxis || DataType.Volume}
                    zAxis={exchangeConfig.zAxis || DataType.Trades}
                />
            );
        case ChartType.ZScoreHeatmap:
            return (
                <ZScoreHeatmap
                    {...commonProps}
                    dataType={exchangeConfig.dataType || DataType.Price}
                    hours={exchangeConfig.hours || '4'}
                    hoursOptions={bootstrap.data?.hours_options[HoursOptionCategory.ZScore] || {}}
                    symbolOptions={bootstrap.data?.symbols || []}
                    symbols={exchangeConfig.symbols ?? chartDefaults?.heatmap.symbols ?? []}
                    typeOptions={bootstrap.data?.data_types || []}
                />
            );
        case ChartType.PriceChangePercentageDay:
            return (
                <PriceChangePercentage
                    {...commonProps}
                    hours={exchangeConfig.hours || '168'}
                    periodType={TimePeriodType.Day}
                    symbol={exchangeConfig.symbol || chartDefaults?.price_change_percentage.symbol || ''}
                    symbolOptions={bootstrap.data?.symbols || []}
                    timeFrameOptions={bootstrap.data?.hours_options[HoursOptionCategory.AveragePrice] || {}}
                />
            );
        case ChartType.PriceChangePercentageHour:
            return (
                <PriceChangePercentage
                    {...commonProps}
                    hours={exchangeConfig.hours || '168'}
                    periodType={TimePeriodType.Hour}
                    symbol={exchangeConfig.symbol || chartDefaults?.price_change_percentage.symbol || ''}
                    symbolOptions={bootstrap.data?.symbols || []}
                    timeFrameOptions={bootstrap.data?.hours_options[HoursOptionCategory.AveragePrice] || {}}
                />
            );
        case ChartType.CorrelationPairHistory:
            return (
                <CorrelationPairHistory
                    {...commonProps}
                    baseSymbol={exchangeConfig.baseSymbol || chartDefaults?.correlation_pair_history.base_symbol || ''}
                    comparisonSymbols={
                        exchangeConfig.comparisonSymbols ||
                        chartDefaults?.correlation_pair_history.comparison_symbols ||
                        []
                    }
                    dataType={exchangeConfig.dataType || DataType.Price}
                    hours={exchangeConfig.hours || '1'}
                    hoursOptions={bootstrap.data?.hours_options[HoursOptionCategory.CorrelationPair] || {}}
                    symbolOptions={bootstrap.data?.symbols || []}
                    typeOptions={bootstrap.data?.data_types || []}
                />
            );
    }
};

export default ChartWrapper;
