import { type Layout } from 'react-grid-layout';

export const Exchange = {
    Binance: 'binance',
    Hyperliquid: 'hyperliquid',
} as const;

export type Exchange = (typeof Exchange)[keyof typeof Exchange];

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
    exchange: Exchange;
    contractType: ContractType;
    hours: string;
    symbol: string;
    type: TimePeriodType;
};

export type HeatmapParams = {
    exchange: Exchange;
    contractType: ContractType;
    hours: string;
    type: string;
    symbols?: string[];
};

export type ZScoreScatterParams = {
    exchange: Exchange;
    contractType: ContractType;
    xAxis: string;
    yAxis: string;
    hours: string;
};

export type ZScoreScatter3DParams = {
    exchange: Exchange;
    contractType: ContractType;
    xAxis: string;
    yAxis: string;
    zAxis: string;
    hours: string;
};

export type ZScoreHeatmapParams = {
    exchange: Exchange;
    contractType: ContractType;
    type: string;
    hours: string;
    symbols?: string[];
};

export type CorrelationPairHistoryParams = {
    exchange: Exchange;
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
    exchange: Exchange;
    contract_type: ContractType;
    chart_defaults: ChartDefaults;
    data_types: Array<DataType>;
    hours_options: Record<string, Record<string, string>>;
    symbols: string[];
};

export type BootstrapParams = {
    exchange: Exchange;
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
    exchange?: Exchange;
    exchangeConfigs?: Partial<Record<Exchange, ExchangeChartConfig>>;
}
