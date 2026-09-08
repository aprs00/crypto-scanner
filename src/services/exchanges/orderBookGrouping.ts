import type { LocalOrderBook, OrderBookLevel } from './types';

type RowCount = number | { bids: number; asks: number };

export const groupOrders = (book: LocalOrderBook, groupByVal: number, rows: RowCount) => ({
    asks: groupSide(book.asks, groupByVal, true, typeof rows === 'number' ? rows : rows.asks),
    bids: groupSide(book.bids, groupByVal, false, typeof rows === 'number' ? rows : rows.bids),
});

const snapNearInteger = (value: number): number => {
    const nearest = Math.round(value);
    const tolerance = Number.EPSILON * Math.max(1, Math.abs(value)) * 8;
    return Math.abs(value - nearest) <= tolerance ? nearest : value;
};

// Levels arrive best-first, so buckets fill in order: once `rows` buckets exist,
// remaining levels only open later buckets and we can stop early.
const groupSide = (levels: OrderBookLevel[], groupByVal: number, isAsk: boolean, rows: number): OrderBookLevel[] => {
    if (rows <= 0 || !(groupByVal > 0)) return [];
    const grouped = new Map<number, number>();

    for (const [price, qty] of levels) {
        const coordinate = snapNearInteger(price / groupByVal);
        const bucket = isAsk ? Math.ceil(coordinate) : Math.floor(coordinate);
        const existing = grouped.get(bucket);
        if (existing === undefined) {
            if (grouped.size === rows) break;
            grouped.set(bucket, qty);
        } else {
            grouped.set(bucket, existing + qty);
        }
    }

    return [...grouped].map(
        ([bucket, quantity]): OrderBookLevel => [Number((bucket * groupByVal).toPrecision(15)), quantity],
    );
};
