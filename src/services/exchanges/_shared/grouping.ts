import type { LocalOrderBook, OrderBookLevel } from '@/routes/~chart/types';

type RowCount = number | { bids: number; asks: number };

export const groupOrders = (book: LocalOrderBook, groupByVal: number, rows: RowCount) => ({
    asks: groupSide(book.asks, groupByVal, true, typeof rows === 'number' ? rows : rows.asks),
    bids: groupSide(book.bids, groupByVal, false, typeof rows === 'number' ? rows : rows.bids),
});

// Levels arrive best-first, so buckets fill in order: once `rows` buckets exist,
// remaining levels only open later buckets and we can stop early.
const groupSide = (levels: OrderBookLevel[], groupByVal: number, isAsk: boolean, rows: number): OrderBookLevel[] => {
    if (rows <= 0 || !(groupByVal > 0)) return [];
    const grouped = new Map<number, number>();

    for (const [price, qty] of levels) {
        const bucket = isAsk ? Math.floor(price / groupByVal) * groupByVal : Math.ceil(price / groupByVal) * groupByVal;
        const existing = grouped.get(bucket);
        if (existing === undefined) {
            if (grouped.size === rows) break;
            grouped.set(bucket, qty);
        } else {
            grouped.set(bucket, existing + qty);
        }
    }

    return [...grouped];
};
