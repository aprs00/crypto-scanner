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

export const CointegrationMetric = {
    SpreadZ: 'spread_z',
    HalfLife: 'half_life',
    AdfT: 'adf_t',
    HedgeRatio: 'hedge_ratio',
    SpreadStd: 'spread_std',
} as const;

export type CointegrationMetric = (typeof CointegrationMetric)[keyof typeof CointegrationMetric];

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
    cointegrationMetric?: CointegrationMetric;
}
