import type { ExchangeInfo } from '../types';

import { CointegrationMetric, DataType, SortDirection, TimePeriodType } from '../settings/config';

export { CointegrationMetric, DataType, SortDirection, TimePeriodType };
export type { CorrelationHeatmapResponse, GridHeatmapResponse } from '../charting/types';
export type { ExchangeChartConfig } from '../settings/config';
export type { ExchangeInfo } from '../types';

export const HoursOptionCategory = {
    Correlation: 'correlation',
    CorrelationPair: 'correlation_pair',
    CointegrationPair: 'cointegration_pair',
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

export type CointegrationPairHistoryParams = {
    exchange: string;
    baseSymbol: string;
    comparisonSymbols: string[];
    window: string;
    hours: string;
    metric: CointegrationMetric;
};

export type CointegrationLiveTableParams = {
    exchange: string;
    window?: string;
    contractType?: string;
    limit: number;
    offset: number;
    sort?: string;
    sortDirection?: SortDirection;
    symbols?: string[];
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
    cointegration_pair_history: {
        base_symbol: string;
        comparison_symbols: string[];
        window: string;
    };
    cointegration_live_table: {
        symbols: string[];
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
    cointegration_live_table: CointegrationLiveTableConfig;
};

export type CorrelationPairHistoryResponse = {
    history: [number, string][][];
};

export type CointegrationPairHistoryResponse = {
    history: [string, number | null][][];
    metric: CointegrationMetric;
    base_symbol: string;
    comparison_symbols: string[];
    window_minutes: number;
};

export type CointegrationLiveTableRow = {
    pair: string;
    symbol1: string;
    symbol2: string;
    spread_z: number;
    half_life: number | null;
    adf_t: number;
    hedge_ratio: number;
    intercept: number;
    spread_std: number;
    updated_at: string;
};

export type CointegrationLiveTableResponse = {
    data: CointegrationLiveTableRow[];
};

export type CointegrationLiveTableConfig = {
    window_options: Record<string, string>;
    limit_options: number[];
    sort_key_to_column_id: Record<string, string>;
    column_id_to_sort_key: Record<string, string>;
    right_aligned_columns: string[];
    sortable_column_ids: string[];
    default_sort_desc: Record<string, boolean>;
};

export type ZScoreScatterResponse = {
    symbol: string;
    data: [number, number];
};

export type ZScoreScatter3DResponse = {
    symbol: string;
    data: [number, number, number];
};
