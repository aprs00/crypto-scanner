import type { ExchangeInfo } from '../types';

import { DataType, TimePeriodType } from '../settings/config';

export { DataType, TimePeriodType };
export type { CorrelationHeatmapResponse, GridHeatmapResponse } from '../charting/types';
export type { ExchangeChartConfig } from '../settings/config';
export type { ExchangeInfo } from '../types';

export const HoursOptionCategory = {
    Correlation: 'correlation',
    CorrelationPair: 'correlation_pair',
    ZScore: 'zscore',
    AveragePrice: 'average_price',
} as const;

export type HoursOptionCategory = (typeof HoursOptionCategory)[keyof typeof HoursOptionCategory];

export type AveragePriceChangeParams = {
    exchange: string;
    hours: string;
    symbol: string;
    type: TimePeriodType;
};

export type HeatmapParams = {
    exchange: string;
    hours: string;
    type: string;
    symbols?: string[];
};

export type ZScoreScatterParams = {
    exchange: string;
    xAxis: string;
    yAxis: string;
    hours: string;
    symbols?: string[];
};

export type ZScoreScatter3DParams = {
    exchange: string;
    xAxis: string;
    yAxis: string;
    zAxis: string;
    hours: string;
    symbols?: string[];
};

export type ZScoreHeatmapParams = {
    exchange: string;
    type: string;
    hours: string;
    symbols?: string[];
};

export type CorrelationPairHistoryParams = {
    exchange: string;
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

type ChartDefaults = {
    heatmap: { symbols: string[] };
    price_change_percentage: { symbol: string };
    correlation_pair_history: {
        base_symbol: string;
        comparison_symbols: string[];
    };
};

export type BootstrapResponse = {
    exchanges: ExchangeInfo[];
    exchange_data: Record<
        string,
        {
            symbols: string[];
            data_types: DataType[];
            hours_options: Record<string, Record<string, string>>;
            chart_defaults: ChartDefaults;
        }
    >;
};

export type CorrelationPairHistoryResponse = {
    history: [number, string][][];
};

export type ZScoreScatterResponse = {
    symbol: string;
    data: [number, number];
};

export type ZScoreScatter3DResponse = {
    symbol: string;
    data: [number, number, number];
};
