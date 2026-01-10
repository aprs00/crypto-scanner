import { type Layout } from 'react-grid-layout';

export interface ExchangeInfo {
    id: string;
    name: string;
}

export const ContractType = {
    Perpetual: 'perpetual',
} as const;

export type ContractType = (typeof ContractType)[keyof typeof ContractType];

export const HoursOptionCategory = {
    Correlation: 'correlation',
    CorrelationPair: 'correlation_pair',
    ZScore: 'zscore',
    AveragePrice: 'average_price',
} as const;

export type HoursOptionCategory = (typeof HoursOptionCategory)[keyof typeof HoursOptionCategory];

export const DataType = {
    Price: 'price',
    Volume: 'volume',
    Trades: 'trades',
} as const;

export type DataType = (typeof DataType)[keyof typeof DataType];

export const TimePeriodType = {
    Day: 'day',
    Hour: 'hour',
} as const;

export type TimePeriodType = (typeof TimePeriodType)[keyof typeof TimePeriodType];

export type AveragePriceChangeParams = {
    exchange: string;
    contractType: ContractType;
    hours: string;
    symbol: string;
    type: TimePeriodType;
};

export type HeatmapParams = {
    exchange: string;
    contractType: ContractType;
    hours: string;
    type: string;
    symbols?: string[];
};

export type ZScoreScatterParams = {
    exchange: string;
    contractType: ContractType;
    xAxis: string;
    yAxis: string;
    hours: string;
    symbols?: string[];
};

export type ZScoreScatter3DParams = {
    exchange: string;
    contractType: ContractType;
    xAxis: string;
    yAxis: string;
    zAxis: string;
    hours: string;
    symbols?: string[];
};

export type ZScoreHeatmapParams = {
    exchange: string;
    contractType: ContractType;
    type: string;
    hours: string;
    symbols?: string[];
};

export type CorrelationPairHistoryParams = {
    exchange: string;
    contractType: ContractType;
    baseSymbol: string;
    comparisonSymbols: string[];
    type: string;
    hours: string;
};

export type AveragePriceChangeResponse = {
    data: {
        value: number;
        itemStyle: {
            color: string;
        };
    }[];
    xAxis: string[];
};

export type ChartDefaults = {
    heatmap: { symbols: string[] };
    price_change_percentage: { symbol: string };
    correlation_pair_history: {
        base_symbol: string;
        comparison_symbols: string[];
    };
};

export type BootstrapResponse = {
    exchanges: ExchangeInfo[];
    exchange: string;
    contract_type: ContractType;
    chart_defaults: ChartDefaults;
    data_types: Array<DataType>;
    hours_options: Record<string, Record<string, string>>;
    symbols: string[];
};

export type BootstrapParams = {
    exchange: string;
    contractType: ContractType;
};

export type CorrelationPairHistoryResponse = {
    history: [number, string][][];
};

export interface ExchangeChartConfig {
    hours?: string;
    xAxis?: string;
    yAxis?: string;
    zAxis?: string;
    symbol?: string;
    baseSymbol?: string;
    comparisonSymbols?: string[];
    symbols?: string[];
    dataType?: DataType;
    periodType?: TimePeriodType;
}

export const ChartType = {
    BetaHeatmap: 'betaHeatmap',
    Scatter: 'scatter',
    Scatter3D: 'scatter3D',
    ZScoreHeatmap: 'zScoreHeatmap',
    PriceChangePercentageDay: 'priceChangePercentageDay',
    PriceChangePercentageHour: 'priceChangePercentageHour',
    CorrelationPairHistory: 'correlationPairHistory',
} as const;

export type ChartType = (typeof ChartType)[keyof typeof ChartType];

export interface ChartItem {
    type: ChartType;
    id: string;
}

export interface ChartTemplate {
    gridLayout: Layout;
}

export interface GridLayout {
    layout?: Layout;
    exchange?: string;
    exchangeConfigs?: Partial<Record<string, ExchangeChartConfig>>;
}

export interface ChartGroup {
    id: string;
    name: string;
    chartIds: string[];
}

export const DEFAULT_GROUP_ID = 'default';

export const ChartTypeLabels: Record<ChartType, string> = {
    [ChartType.BetaHeatmap]: 'Pearson Correlation Heatmap',
    [ChartType.Scatter]: 'Z-Score Scatter',
    [ChartType.Scatter3D]: 'Z-Score Scatter 3D',
    [ChartType.ZScoreHeatmap]: 'Z-Score Heatmap',
    [ChartType.PriceChangePercentageDay]: 'Price Change % (Day)',
    [ChartType.PriceChangePercentageHour]: 'Price Change % (Hour)',
    [ChartType.CorrelationPairHistory]: 'Correlation Pair History',
};

export const ChartTypeDescriptions: Record<ChartType, string> = {
    [ChartType.BetaHeatmap]: 'Visualize Pearson correlation coefficients between assets as a heatmap',
    [ChartType.Scatter]: '2D scatter plot showing z-scores for two data types',
    [ChartType.Scatter3D]: '3D scatter plot showing z-scores for three data types',
    [ChartType.ZScoreHeatmap]: 'Z-score values displayed as a heatmap grid',
    [ChartType.PriceChangePercentageDay]: 'Daily price change percentages over time',
    [ChartType.PriceChangePercentageHour]: 'Hourly price change percentages over time',
    [ChartType.CorrelationPairHistory]: 'Track correlation between a base symbol and comparison symbols over time',
};
