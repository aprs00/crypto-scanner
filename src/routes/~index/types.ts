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

export const SortDirection = {
    Asc: 'asc',
    Desc: 'desc',
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

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

export type CointegrationLiveTableParams = {
    exchange: string;
    window?: string;
    contractType?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    sortDirection?: SortDirection;
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
    exchange_data: Record<
        string,
        {
            symbols: string[];
            data_types: Array<DataType>;
            hours_options: Record<string, Record<string, string>>;
            chart_defaults: ChartDefaults;
        }
    >;
    cointegration_live_table: CointegrationLiveTableConfig;
};

export type CorrelationPairHistoryResponse = {
    history: [number, string][][];
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
    window?: string;
    sort?: string;
    sortDirection?: SortDirection;
    limit?: number;
}

export const ChartType = {
    BetaHeatmap: 'betaHeatmap',
    Scatter: 'scatter',
    Scatter3D: 'scatter3D',
    ZScoreHeatmap: 'zScoreHeatmap',
    PriceChangePercentageDay: 'priceChangePercentageDay',
    PriceChangePercentageHour: 'priceChangePercentageHour',
    CorrelationPairHistory: 'correlationPairHistory',
    CointegrationLiveTable: 'cointegrationLiveTable',
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
    [ChartType.CointegrationLiveTable]: 'Cointegration Table (Pairs / Mean-Reversion)',
};

export const ChartTypeDescriptions: Record<ChartType, string> = {
    [ChartType.BetaHeatmap]: 'Visualize Pearson correlation coefficients between assets as a heatmap',
    [ChartType.Scatter]: '2D scatter plot showing z-scores for two data types',
    [ChartType.Scatter3D]: '3D scatter plot showing z-scores for three data types',
    [ChartType.ZScoreHeatmap]: 'Z-score values displayed as a heatmap grid',
    [ChartType.PriceChangePercentageDay]: 'Daily price change percentages over time',
    [ChartType.PriceChangePercentageHour]: 'Hourly price change percentages over time',
    [ChartType.CorrelationPairHistory]: 'Track correlation between a base symbol and comparison symbols over time',
    [ChartType.CointegrationLiveTable]: 'Monitor top cointegrated pairs with key statistical metrics',
};
