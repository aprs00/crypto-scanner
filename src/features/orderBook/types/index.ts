export type OrderBookResponseType = {
    lastUpdateId: number;
    asks: string[][];
    bids: string[][];
};

export type StreamTickerResponseType = {
    E: number;
    U: number;
    a: string[][];
    b: string[][];
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
    asksGetter: Record<string, string>;
    bidsGetter: Record<string, string>;
    asksStream: string[][];
    bidsStream: string[][];
};

export type OrderBookFiltersPropsType = {
    numOfOrderBookRows: number;
    setNumOfOrderBookRows: (num: number) => void;
    groupByNum: number;
    setGroupByNum: (num: number) => void;
};

export type OrderBookTablePropsType = {
    groupedOrderBookAsks: Record<string, string>;
    groupedOrderBookBids: Record<string, string>;
    groupByNum: number;
    numOfOrderBookRows: number;
    streamAggTradePrice: string;
};
