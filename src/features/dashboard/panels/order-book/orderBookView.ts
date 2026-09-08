import type { LocalOrderBook, OrderBookLevel } from '@/services/exchanges/types';

import { groupOrders } from '@/services/exchanges/orderBookGrouping';

export type OrderBookViewRow = Readonly<{
    amount: number;
    cumulativeAmount: number;
    cumulativePercentage: number;
    price: number;
    sizePercentage: number;
}>;

type OrderBookVolumeSummary = Readonly<{
    askAmount: number;
    askPercentage: number;
    bidAmount: number;
    bidPercentage: number;
}>;

type OrderBookView = Readonly<{
    asks: readonly OrderBookViewRow[];
    bids: readonly OrderBookViewRow[];
    volume: OrderBookVolumeSummary;
}>;

type BuildOrderBookViewOptions = Readonly<{
    askRows: number;
    bidRows: number;
    groupBy: number;
    notional: boolean;
}>;

const displayAmount = (price: number, quantity: number, notional: boolean): number =>
    notional ? price * quantity : quantity;

const sumSide = (levels: readonly OrderBookLevel[], notional: boolean): number =>
    levels.reduce((sum, [price, quantity]) => sum + displayAmount(price, quantity, notional), 0);

const normalizeRowCount = (value: number): number => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0);

const buildRows = (
    levels: readonly OrderBookLevel[],
    maxAmount: number,
    notional: boolean,
): readonly OrderBookViewRow[] => {
    const amounts = levels.map(([price, quantity]) => displayAmount(price, quantity, notional));
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    let cumulativeAmount = 0;

    return levels.map(([price], index) => {
        const amount = amounts[index];
        cumulativeAmount += amount;

        return {
            amount,
            cumulativeAmount,
            cumulativePercentage: total > 0 ? (cumulativeAmount / total) * 100 : 0,
            price,
            sizePercentage: maxAmount > 0 ? (amount / maxAmount) * 100 : 0,
        };
    });
};

export const buildOrderBookView = (
    book: LocalOrderBook,
    { askRows, bidRows, groupBy, notional }: BuildOrderBookViewOptions,
): OrderBookView => {
    const normalizedGroupBy = Number.isFinite(groupBy) && groupBy > 0 ? groupBy : 0;
    const grouped = groupOrders(book, normalizedGroupBy, {
        asks: normalizeRowCount(askRows),
        bids: normalizeRowCount(bidRows),
    });
    const visibleAmounts = [...grouped.asks, ...grouped.bids].map(([price, quantity]) =>
        displayAmount(price, quantity, notional),
    );
    const maxAmount = Math.max(0, ...visibleAmounts);

    const askAmount = sumSide(book.asks, notional);
    const bidAmount = sumSide(book.bids, notional);
    const loadedAmount = askAmount + bidAmount;
    const askPercentage = loadedAmount > 0 ? (askAmount / loadedAmount) * 100 : 0;

    return {
        asks: buildRows(grouped.asks, maxAmount, notional),
        bids: buildRows(grouped.bids, maxAmount, notional),
        volume: {
            askAmount,
            askPercentage,
            bidAmount,
            bidPercentage: loadedAmount > 0 ? 100 - askPercentage : 0,
        },
    };
};
