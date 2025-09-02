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

export type ZScoreMatrixParams = {
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
    tickers: string[];
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

export interface ChartConfig {
    hours?: string;
    xAxis?: string;
    yAxis?: string;
    symbol?: string;
    type?: string;
}

export type ChartType =
    | 'betaHeatmap'
    | 'scatter'
    | 'zScoreHistory'
    | 'zScoreHeatmap'
    | 'priceChangePercentageDay'
    | 'priceChangePercentageHour';

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
