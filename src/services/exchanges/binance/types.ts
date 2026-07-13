export type BinanceFuturesSymbolFilter = {
    filterType: string;
    tickSize?: string;
};

export type BinanceFuturesSymbolInfo = {
    baseAsset: string;
    contractType: string;
    filters: BinanceFuturesSymbolFilter[];
    marginAsset: string;
    quoteAsset: string;
    status: string;
    symbol: string;
};

export type BinanceFuturesExchangeInfoResponse = {
    symbols: BinanceFuturesSymbolInfo[];
};

export type BinanceFuturesOrderBookSnapshot = {
    E: number;
    T: number;
    asks: [string, string][];
    bids: [string, string][];
    lastUpdateId: number;
};

export type BinanceFuturesDepthUpdate = {
    E: number;
    T: number;
    U: number;
    a: [string, string][];
    b: [string, string][];
    e: 'depthUpdate';
    ps?: string;
    pu: number;
    s: string;
    st?: number;
    u: number;
};

export type BinanceFuturesAggregateTrade = {
    E: number;
    T: number;
    a: number;
    e: 'aggTrade';
    f: number;
    l: number;
    m: boolean;
    nq?: string;
    p: string;
    q: string;
    s: string;
    st?: number;
};

export type BinanceFuturesBookTicker = {
    A: string;
    B: string;
    E: number;
    T: number;
    a: string;
    b: string;
    e: 'bookTicker';
    ps?: string;
    s: string;
    st?: number;
    u: number;
};
