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
    getter: Record<string, string>;
    setter: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    newStream: string[][];
};

export type OrderBookFiltersPropsType = {
    numOfOrderBookRows: number;
    setNumOfOrderBookRows: (num: number) => void;
    groupByNum: number;
    setGroupByNum: (num: number) => void;
};

export type OrderBookTablePropsType = {
    hashOrderBookAsks: Record<string, string>;
    hashOrderBookBids: Record<string, string>;
    groupByNum: number;
    numOfOrderBookRows: number;
    streamAggTradePrice: string;
};
