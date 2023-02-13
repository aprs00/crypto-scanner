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
