import { type Layout } from 'react-grid-layout';

export type AveragePriceChangeParams = {
    hours: string;
    symbol: string;
    type: string;
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

export type ZScoreHistoryParams = {
    type: string;
    duration: string;
};

export type ZScoreHeatmapParams = {
    type: string;
    hours: string;
};

export type CorrelationPairHistoryParams = {
    symbol1: string;
    symbol2: string;
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
    data_types: string[];
    hours_options: Record<string, Record<string, string>>;
    symbols: string[];
};

export type ZScoreHistoryResponse = {
    legend: string[];
    data: {
        name: string;
        stack: string;
        data: number[];
    }[];
    xAxis: string[];
};

export type CorrelationPairHistoryResponse = {
    history: [number, string][];
};

export interface ChartConfig {
    hours?: string;
    xAxis?: string;
    yAxis?: string;
    symbol?: string;
    symbol1?: string;
    symbol2?: string;
    type?: string;
}

export const ChartType = {
    BetaHeatmap: 'betaHeatmap',
    Scatter: 'scatter',
    ZScoreHistory: 'zScoreHistory',
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
    type: ChartType;
}

export interface GridLayout extends ChartConfig {
    layout: Layout;
}
