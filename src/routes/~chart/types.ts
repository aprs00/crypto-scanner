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
