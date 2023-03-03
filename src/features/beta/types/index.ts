export type OrderBookResponseType = {
    lastUpdateId: number;
    asks: string[][];
    bids: string[][];
};

export type StreamTickerResponseType = {
    u: string;
    s: string;
    b: string;
    B: string;
    a: string;
    A: string;
};

export type UpdateOrderBookPropsType = {
    getter: Record<string, string>;
    setter: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    newStream: string[][];
    sortByAscending: boolean;
};

export type WindowSizeResponseType = {
    C: number;
    E: number;
    F: number;
    L: number;
    O: number;
    P: string;
    c: string;
    e: string;
    h: string;
    l: string;
    n: number;
    o: string;
    p: string;
    q: string;
    s: string;
    v: string;
    w: string;
};

export type BetaTablePropsType = {
    betaTickersList: string[];
    results: any;
};

export type TickerCalculationsType = {
    percentages: number[];
    sum: number;
    sumSq: number;
};
