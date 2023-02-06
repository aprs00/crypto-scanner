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

export type UpdateOrderBookPropsType = {
    getter: Record<string, string>;
    setter: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    newStream: string[][];
    sortByAscending: boolean;
};
