import type { SelectOption } from '@/types/api';

import { type Layout } from 'react-grid-layout';

export type AveragePriceChangeParams = {
    duration: string;
    symbol: string;
    type: string;
};

export type HeatmapParams = {
    duration: string;
    type: string;
};

export type ZScoreMatrixParams = {
    xAxis: string;
    yAxis: string;
    duration: string;
};

export type ZScoreHistoryParams = {
    type: string;
    duration: string;
};

export type ZScoreHeatmapParams = {
    type: string;
    duration: string;
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

export type SelectOptionsResponse = {
    average_price: SelectOption[];
    correlation: SelectOption[];
    zscore: SelectOption[];
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
    tf?: string;
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
