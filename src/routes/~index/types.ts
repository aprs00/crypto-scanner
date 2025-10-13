import { type Layout } from 'react-grid-layout';

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
    hours: string;
    symbol: string;
    type: TimePeriodType;
};

export type HeatmapParams = {
    hours: string;
    type: string;
};

export type ZScoreScatterParams = {
    xAxis: string;
    yAxis: string;
    hours: string;
};

export type ZScoreScatter3DParams = {
    xAxis: string;
    yAxis: string;
    zAxis: string;
    hours: string;
};

export type ZScoreHeatmapParams = {
    type: string;
    hours: string;
};

export type CorrelationPairHistoryParams = {
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

export type BootstrapResponse = {
    data_types: Array<DataType>;
    hours_options: Record<string, Record<string, string>>;
    symbols: string[];
};

export type CorrelationPairHistoryResponse = {
    history: [number, string][][];
};

export interface ChartConfig {
    hours?: string;
    xAxis?: string;
    yAxis?: string;
    zAxis?: string;
    symbol?: string;
    baseSymbol?: string;
    comparisonSymbols?: string[];
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

export interface GridLayout extends ChartConfig {
    layout: Layout;
}
