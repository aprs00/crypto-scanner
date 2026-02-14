import { useBootstrap } from '../api';
import {
    ChartType,
    DataType,
    HoursOptionCategory,
    TimePeriodType,
    type ChartItem,
    type ExchangeChartConfig,
    type GridLayout,
} from '../types';
import useChartStore from '../useChartStore';
import BetaHeatmap from './BetaHeatmap';
import CointegrationLiveTable from './CointegrationLiveTable';
import CointegrationPairHistory from './CointegrationPairHistory';
import CorrelationPairHistory from './CorrelationPairHistory';
import PriceChangePercentage from './PriceChangePercentage';
import ZScoreHeatmap from './ZScoreHeatmap';
import Scatter from './ZScoreScatter';
import Scatter3D from './ZScoreScatter3D';

const DEFAULT_EXCHANGE = 'binance';

const ChartWrapper = ({ chart, savedLayout }: { chart: ChartItem; savedLayout: GridLayout }) => {
    const exchange = savedLayout.exchange || DEFAULT_EXCHANGE;

    const exchangeConfig = savedLayout.exchangeConfigs?.[exchange] || {};

    const bootstrap = useBootstrap();

    // Extract exchange-specific data
    const exchangeData = bootstrap.data?.exchange_data?.[exchange];
    const chartDefaults = exchangeData?.chart_defaults;
    const symbols = exchangeData?.symbols || [];
    const dataTypes = exchangeData?.data_types || [];
    const hoursOptions = exchangeData?.hours_options || {};
    const cointegrationConfig = bootstrap.data?.cointegration_live_table;

    const removeChart = useChartStore((state) => state.removeChart);
    const setChartExchange = useChartStore((state) => state.setChartExchange);
    const updateExchangeConfig = useChartStore((state) => state.updateExchangeConfig);

    const exchanges = bootstrap.data?.exchanges || [];

    const commonProps = {
        exchange,
        exchanges,
        onExchangeChange: (newExchange: string) => setChartExchange(chart.id, newExchange),
        onConfigChange: (config: ExchangeChartConfig) => updateExchangeConfig(chart.id, exchange, config),
        onRemoveClick: () => removeChart(chart.id, chart.type),
    };

    switch (chart.type) {
        case ChartType.BetaHeatmap:
            return (
                <BetaHeatmap
                    {...commonProps}
                    dataType={exchangeConfig.dataType || DataType.Price}
                    defaultSymbols={chartDefaults?.heatmap.symbols}
                    hours={exchangeConfig.hours || '4'}
                    hoursOptions={hoursOptions[HoursOptionCategory.Correlation] || {}}
                    symbolOptions={symbols}
                    symbols={exchangeConfig.symbols ?? chartDefaults?.heatmap.symbols ?? []}
                    typeOptions={dataTypes}
                />
            );
        case ChartType.Scatter:
            return (
                <Scatter
                    {...commonProps}
                    defaultSymbols={chartDefaults?.heatmap.symbols}
                    hours={exchangeConfig.hours || '4'}
                    hoursOptions={hoursOptions[HoursOptionCategory.ZScore] || {}}
                    symbolOptions={symbols}
                    symbols={exchangeConfig.symbols ?? chartDefaults?.heatmap.symbols ?? []}
                    xAxis={exchangeConfig.xAxis || DataType.Price}
                    yAxis={exchangeConfig.yAxis || DataType.Volume}
                />
            );
        case ChartType.Scatter3D: {
            const defaultZAxis = dataTypes.includes(DataType.Trades) ? DataType.Trades : DataType.Volume;
            return (
                <Scatter3D
                    {...commonProps}
                    defaultSymbols={chartDefaults?.heatmap.symbols}
                    hours={exchangeConfig.hours || '4'}
                    hoursOptions={hoursOptions[HoursOptionCategory.ZScore] || {}}
                    symbolOptions={symbols}
                    symbols={exchangeConfig.symbols ?? chartDefaults?.heatmap.symbols ?? []}
                    xAxis={exchangeConfig.xAxis || DataType.Price}
                    yAxis={exchangeConfig.yAxis || DataType.Volume}
                    zAxis={exchangeConfig.zAxis || defaultZAxis}
                />
            );
        }
        case ChartType.ZScoreHeatmap:
            return (
                <ZScoreHeatmap
                    {...commonProps}
                    dataType={exchangeConfig.dataType || DataType.Price}
                    defaultSymbols={chartDefaults?.heatmap.symbols}
                    hours={exchangeConfig.hours || '4'}
                    hoursOptions={hoursOptions[HoursOptionCategory.ZScore] || {}}
                    symbolOptions={symbols}
                    symbols={exchangeConfig.symbols ?? chartDefaults?.heatmap.symbols ?? []}
                    typeOptions={dataTypes}
                />
            );
        case ChartType.PriceChangePercentageDay:
            return (
                <PriceChangePercentage
                    {...commonProps}
                    hours={exchangeConfig.hours || '168'}
                    periodType={TimePeriodType.Day}
                    symbol={exchangeConfig.symbol || chartDefaults?.price_change_percentage.symbol || ''}
                    symbolOptions={symbols}
                    timeFrameOptions={hoursOptions[HoursOptionCategory.AveragePrice] || {}}
                />
            );
        case ChartType.PriceChangePercentageHour:
            return (
                <PriceChangePercentage
                    {...commonProps}
                    hours={exchangeConfig.hours || '168'}
                    periodType={TimePeriodType.Hour}
                    symbol={exchangeConfig.symbol || chartDefaults?.price_change_percentage.symbol || ''}
                    symbolOptions={symbols}
                    timeFrameOptions={hoursOptions[HoursOptionCategory.AveragePrice] || {}}
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
                    defaultComparisonSymbols={chartDefaults?.correlation_pair_history.comparison_symbols}
                    hours={exchangeConfig.hours || '1'}
                    hoursOptions={hoursOptions[HoursOptionCategory.CorrelationPair] || {}}
                    symbolOptions={symbols}
                    typeOptions={dataTypes}
                />
            );
        case ChartType.CointegrationPairHistory:
            return (
                <CointegrationPairHistory
                    {...commonProps}
                    baseSymbol={
                        exchangeConfig.baseSymbol || chartDefaults?.cointegration_pair_history.base_symbol || ''
                    }
                    comparisonSymbols={
                        exchangeConfig.comparisonSymbols ||
                        chartDefaults?.cointegration_pair_history.comparison_symbols ||
                        []
                    }
                    defaultComparisonSymbols={chartDefaults?.cointegration_pair_history.comparison_symbols}
                    hours={exchangeConfig.hours || '4'}
                    hoursOptions={hoursOptions[HoursOptionCategory.CointegrationPair] || {}}
                    metric={exchangeConfig.cointegrationMetric}
                    symbolOptions={symbols}
                    window={exchangeConfig.window || chartDefaults?.cointegration_pair_history.window || ''}
                    windowOptions={cointegrationConfig?.window_options || {}}
                />
            );
        case ChartType.CointegrationLiveTable:
            return (
                <CointegrationLiveTable
                    {...commonProps}
                    config={cointegrationConfig}
                    limit={exchangeConfig.limit}
                    sort={exchangeConfig.sort}
                    sortDirection={exchangeConfig.sortDirection}
                    symbolOptions={symbols}
                    symbols={exchangeConfig.symbols ?? symbols}
                    window={exchangeConfig.window}
                />
            );
    }
};

export default ChartWrapper;
