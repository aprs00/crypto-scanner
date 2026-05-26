export type TapeStateType = {
    price: string;
    size: string;
    time: number;
    market: boolean;
    aggregateTradeId: number;
};

export type SymbolInfoType = {
    symbol: string;
    status: string;
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quotePrecision: number;
    quoteAssetPrecision: number;
    baseCommissionPrecision: number;
    quoteCommissionPrecision: number;
    orderTypes: string[];
    icebergAllowed: boolean;
    ocoAllowed: boolean;
    quoteOrderQtyMarketAllowed: boolean;
    allowTrailingStop: boolean;
    cancelReplaceAllowed: boolean;
    isSpotTradingAllowed: boolean;
    isMarginTradingAllowed: boolean;
    filters: {
        filterType: string;
        minPrice?: string;
        maxPrice?: string;
        tickSize?: string;
        multiplierUp?: string;
        multiplierDown?: string;
        avgPriceMins?: number;
        minQty?: string;
        maxQty?: string;
        stepSize?: string;
        minNotional?: string;
        applyToMarket?: boolean;
        limit?: number;
        maxNumOrders?: number;
        maxNumAlgoOrders?: number;
    }[];
    permissions: string[];
    defaultSelfTradePreventionMode: string;
    allowedSelfTradePreventionModes: string[];
};

export type ExchangeInfoResponseType = {
    timezone: string;
    serverTime: number;
    rateLimits: {
        rateLimitType: string;
        interval: string;
        intervalNum: number;
        limit: number;
    }[];
    exchangeFilters: any[];
    symbols: SymbolInfoType[];
};

export type OrderBookResponseType = {
    lastUpdateId: number;
    asks: [string, string][];
    bids: [string, string][];
};

// A maintained local book with numeric [price, quantity] levels, bids sorted
// high->low and asks low->high. This is what the order-book stream emits to
// consumers (parsed once on ingest rather than re-parsed at every call site).
export type OrderBookLevel = [number, number];

export type LocalOrderBook = {
    lastUpdateId: number;
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
};

export type StreamTickerResponseType = {
    E: number;
    U: number;
    a: [string, string][];
    b: [string, string][];
    e: string;
    s: string;
    u: number;
};

export type StreamAggTradeResponseType = {
    E: number;
    M: boolean;
    T: number;
    a: number;
    e: string;
    f: number;
    l: number;
    m: boolean;
    p: string;
    q: string;
    s: string;
};

export const Orientation = {
    V: 'V',
    H: 'H',
} as const;

export type Orientation = (typeof Orientation)[keyof typeof Orientation];

export const OrderbookType = {
    Asks: 'asks',
    Bids: 'bids',
} as const;

export type OrderbookType = (typeof OrderbookType)[keyof typeof OrderbookType];

export const PanelType = {
    TradingView: 'tradingView',
    OrderBook: 'orderbook',
    Depth: 'depth',
    Tape: 'tape',
} as const;

export type PanelType = (typeof PanelType)[keyof typeof PanelType];

export interface PanelItem {
    id: string;
    type: PanelType;
}

export const PanelTypeLabels: Record<PanelType, string> = {
    [PanelType.TradingView]: 'Chart',
    [PanelType.OrderBook]: 'Order Book',
    [PanelType.Depth]: 'Depth Chart',
    [PanelType.Tape]: 'Tape',
};

export const PanelTypeDescriptions: Record<PanelType, string> = {
    [PanelType.TradingView]: 'TradingView candlestick chart',
    [PanelType.OrderBook]: 'Live bid/ask ladder grouped by tick size',
    [PanelType.Depth]: 'Cumulative bid/ask depth around mid price',
    [PanelType.Tape]: 'Live trade tape with side coloring',
};
