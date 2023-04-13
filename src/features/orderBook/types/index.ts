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

export type UpdateOrderBookPropsType = {
    asksGetter: [string, string][];
    bidsGetter: [string, string][];
    asksStream: [string, string][];
    bidsStream: [string, string][];
};

export type OrderBookFiltersPropsType = {
    numOfOrderBookRows: number;
    setNumOfOrderBookRows: (num: number) => void;
    groupByNum: number;
    setGroupByNum: (num: number) => void;
};

export type OrderBookTablePropsType = {
    groupedAsks: [string, string][];
    groupedBids: [string, string][];
    numOfOrderBookRows: number;
    streamAggTradePrice: string;
};
