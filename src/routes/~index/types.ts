import type { SelectOption } from '@/types/api';

export type AveragePriceChangeParams = {
    duration: string;
    symbol: string;
    type: string;
};

export type HeatmapParams = {
    duration: string;
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
    all: SelectOption[];
    ltf: SelectOption[];
    htf: SelectOption[];
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
    | 'priceChangePercentageDay'
    | 'priceChangePercentageHour';

export interface ChartItem {
    type: ChartType;
    id: string;
}

export interface Layout {
    h: number;
    w: number;
    x: number;
    y: number;
}

export interface LayoutItem extends Layout {
    i: string;
}

export interface ChartTemplate {
    gridLayout: Layout;
    type: ChartType;
}
