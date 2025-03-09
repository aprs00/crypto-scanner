import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';
import CSSelect from '@/components/UI/CSSelect';
import CSSpinner from '@/components/UI/CSSpinner';
import NumberInput from '@/components/UI/NumberInput';
import {formatNumber} from '@/utils/number';

import {OrderBookResponseType, StreamTickerResponseType} from '../types';
import {tableBackgroundStyle} from '../utils';

class BinanceOrderBookService {
    private ws: WebSocket | null = null;
    private eventBuffer: StreamTickerResponseType[] = [];
    private firstEventU: number | null = null;
    private orderBook: OrderBookResponseType = {bids: [], asks: [], lastUpdateId: 0};
    private symbol: string;
    private onOrderBookUpdate: (orderBook: OrderBookResponseType) => void;

    constructor(symbol: string, onOrderBookUpdate: (orderBook: OrderBookResponseType) => void) {
        this.symbol = symbol.toLowerCase();
        this.onOrderBookUpdate = onOrderBookUpdate;
    }

    public initialize(): void {
        this.eventBuffer = [];
        this.firstEventU = null;
        this.orderBook = {bids: [], asks: [], lastUpdateId: 0};

        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${this.symbol}@depth@100ms`);

        this.ws.onopen = () => {};
        this.ws.onclose = () => {};
        this.ws.onerror = () => {};

        this.ws.onmessage = (event) => {
            const data: StreamTickerResponseType = JSON.parse(event.data);

            if (this.firstEventU === null && data.U) {
                this.firstEventU = data.U;
                this.fetchSnapshot();
            } else if (this.orderBook.lastUpdateId === 0) {
                this.eventBuffer.push(data);
            } else {
                this.processEvent(data);
            }
        };
    }

    public groupOrders = (orderBook: OrderBookResponseType, groupByVal: number, numOfRows: number) => {
        return {
            bids: this.groupOrdersByPrice(orderBook.bids, groupByVal, false, numOfRows),
            asks: this.groupOrdersByPrice(orderBook.asks, groupByVal, true, numOfRows),
        };
    };

    public close(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    private async fetchSnapshot(): Promise<void> {
        try {
            const response = await fetch(
                `https://api.binance.com/api/v3/depth?symbol=${this.symbol.toUpperCase()}&limit=5000`,
            );
            const data = await response.json();

            if (data.lastUpdateId < (this.firstEventU ?? 0)) {
                this.fetchSnapshot();
                return;
            }

            this.processSnapshot(data);
        } catch (error) {
            /* empty */
        }
    }

    private processSnapshot(snapshot: OrderBookResponseType): void {
        const newOrderBook = {
            bids: snapshot.bids,
            asks: snapshot.asks,
            lastUpdateId: snapshot.lastUpdateId,
        };

        const validEvents = this.eventBuffer.filter((event) => event.u > snapshot.lastUpdateId);

        if (validEvents.length > 0) {
            const firstEvent: StreamTickerResponseType = validEvents[0];
            if (firstEvent.U <= snapshot.lastUpdateId + 1 && firstEvent.u >= snapshot.lastUpdateId + 1) {
                let currentBook = {...newOrderBook};

                validEvents.forEach((event) => {
                    currentBook = this.applyEvent(currentBook, event);
                });

                this.orderBook = currentBook;
                this.onOrderBookUpdate(currentBook);
                this.eventBuffer = [];
            } else {
                setTimeout(() => this.initialize(), 1000);
                this.orderBook = newOrderBook;
                this.onOrderBookUpdate(newOrderBook);
            }
        } else {
            this.orderBook = newOrderBook;
            this.onOrderBookUpdate(newOrderBook);
        }
    }

    private processEvent(event: StreamTickerResponseType): void {
        const updatedBook = this.applyEvent(this.orderBook, event);

        if (updatedBook.lastUpdateId !== this.orderBook.lastUpdateId) {
            this.orderBook = updatedBook;
            this.onOrderBookUpdate(updatedBook);
        }
    }

    private applyEvent(book: OrderBookResponseType, event: StreamTickerResponseType): OrderBookResponseType {
        if (event.u <= book.lastUpdateId) {
            return book;
        }

        if (event.U > book.lastUpdateId + 1) {
            setTimeout(() => this.initialize(), 1000);
        }

        const updatedAsks = this.updateOrderBook(book.asks, event.a, true);
        const updatedBids = this.updateOrderBook(book.bids, event.b, false);

        return {
            asks: updatedAsks,
            bids: updatedBids,
            lastUpdateId: event.u,
        };
    }

    private updateOrderBook = (getter: [string, string][], stream: [string, string][], ascending: boolean) => {
        for (const [price, quantity] of stream) {
            const {exactMatch, index} = this.findTargetPriceIndex(getter, price, ascending);
            if (quantity === '0.00000000') {
                if (exactMatch) getter.splice(index, 1);
            } else {
                if (exactMatch) getter[index][1] = quantity;
                else getter.splice(index, 0, [price, quantity]);
            }
        }

        return getter;
    };

    private groupOrdersByPrice = (
        getter: [string, string][],
        groupByVal: number,
        isBid: boolean,
        numOfRows: number,
    ) => {
        const groupedGetter = new Map();

        const makeCalculateRoundedPrice = (isBid: boolean) =>
            isBid
                ? (orderPrice: number) => Math.ceil(orderPrice / groupByVal) * groupByVal
                : (orderPrice: number) => Math.floor(orderPrice / groupByVal) * groupByVal;

        const calculateRoundedPrice = makeCalculateRoundedPrice(isBid);

        for (let i = 0; i < getter.length; i++) {
            const [priceStr, quantityStr] = getter[i];
            const orderPrice = parseFloat(priceStr);
            const quantity = parseFloat(quantityStr);
            const roundedPrice = calculateRoundedPrice(orderPrice);

            if (groupedGetter.has(roundedPrice))
                groupedGetter.set(roundedPrice, groupedGetter.get(roundedPrice) + quantity);
            else groupedGetter.set(roundedPrice, quantity);
        }

        const roundedGetter = [];

        for (let i = 0; i < numOfRows; i++) {
            roundedGetter.push(Array.from(groupedGetter)[i]);
        }

        return roundedGetter;
    };

    private findTargetPriceIndex = (bids: [string, string][], price: string, ascending: boolean) => {
        let low = 0;
        let high = bids.length - 1;
        const parsedPrice = parseFloat(price);

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const midPrice = parseFloat(bids[mid][0]);

            if (midPrice === parsedPrice) return {exactMatch: true, index: mid};
            else if ((ascending && midPrice < parsedPrice) || (!ascending && midPrice > parsedPrice)) low = mid + 1;
            else high = mid - 1;
        }

        return {exactMatch: false, index: low};
    };
}

export type OrderBookTablePropsType = {
    tableHeight: number;
    symbol: string;
    symbolTickSize: number;
};

const tableAlignmentOptions = [
    {label: 'V', value: 'V'},
    {label: 'H', value: 'H'},
];

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const {symbolTickSize, tableHeight} = props;

    const [orderBook, setOrderBook] = useState<OrderBookResponseType>({bids: [], asks: [], lastUpdateId: 0});
    const [groupedOrderBook, setGroupedOrderBook] = useState<{
        bids: [number, number][];
        asks: [number, number][];
    }>({bids: [], asks: []});
    const [numOfTicks, setNumOfTicks] = useState(100);
    const [tableAlignment, setTableAlignment] = useState('V');
    const binanceServiceRef = useRef<BinanceOrderBookService | null>(null);

    const groupByVal = useMemo(() => symbolTickSize * numOfTicks, [symbolTickSize, numOfTicks]);

    const tickSizeDecimalPlaces = useMemo(() => {
        const tickSizeStr = symbolTickSize.toString();
        const decimalIndex = tickSizeStr.indexOf('.');
        return decimalIndex === -1 ? 0 : tickSizeStr.length - decimalIndex - 1;
    }, [symbolTickSize]);

    const calculatedNumOfRows = useMemo(() => {
        const divideBy = tableAlignment === 'V' ? 4 : 1;
        const calc = Math.floor(tableHeight / 30);
        const numOfRows = (calc % 2 === 0 ? calc : calc - 1) / 2 + calc / divideBy;
        return Math.floor(numOfRows);
    }, [tableHeight, tableAlignment]);

    const maxQuantity = useMemo(() => {
        const bidsAndAsks = groupedOrderBook.asks?.concat(groupedOrderBook.bids) || [];
        return Math.max(...bidsAndAsks.map((limit: [number, number]) => limit?.[1]));
    }, [groupedOrderBook, calculatedNumOfRows]);

    const orderBookTable = useCallback(
        (groupedGetter: [number, number][], type: string) => {
            const rows = [];
            const isTableAlignmentHorizontal = tableAlignment === 'H' && type === 'bids';
            const tableAlignmentClassContainer = isTableAlignmentHorizontal ? 'text-right' : '';
            const tableAlignmentClassRow = isTableAlignmentHorizontal ? 'order-1' : '';

            for (let i = 0; i < groupedGetter?.length; i++) {
                if (!groupedGetter[i]) continue;
                const [price, quantity] = groupedGetter[i];
                const percentage = (quantity / maxQuantity) * 100;
                const formattedPrice = formatNumber(price, {maximumFractionDigits: tickSizeDecimalPlaces});
                const formattedQuantity = formatNumber(quantity, {maximumFractionDigits: 6});

                rows.push(
                    <div
                        className={`grid grid-cols-2 mb-0.5 rounded text-slate-200 text-sm p-0.5 ${tableAlignmentClassContainer}`}
                        key={price}
                        style={{background: tableBackgroundStyle(type, tableAlignment, percentage)}}
                    >
                        <div className={tableAlignmentClassRow}>{formattedPrice}</div>
                        <div>{formattedQuantity}</div>
                    </div>,
                );
            }

            return rows;
        },
        [groupedOrderBook, maxQuantity, calculatedNumOfRows],
    );

    useEffect(() => {
        if (!symbolTickSize || !orderBook.asks || !binanceServiceRef.current) return;

        setGroupedOrderBook(binanceServiceRef.current.groupOrders(orderBook, groupByVal, calculatedNumOfRows));
    }, [numOfTicks, calculatedNumOfRows, orderBook, groupByVal, symbolTickSize]);

    useEffect(() => {
        // Create the Binance service and initialize it
        binanceServiceRef.current = new BinanceOrderBookService('btcusdt', setOrderBook);
        binanceServiceRef.current.initialize();

        return () => {
            if (binanceServiceRef.current) {
                binanceServiceRef.current.close();
            }
        };
    }, []);

    return (
        <>
            {!groupedOrderBook.asks.length && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <CSSpinner />
                </div>
            )}

            <div className="border-4 border-slate-800 rounded h-full z-50">
                <div className="flex items-center bg-slate-800 pb-1 justify-between">
                    <DraggableIcon id="drag-handle" />
                    <div className="flex items-center gap-2">
                        <CSSelect options={tableAlignmentOptions} value={tableAlignment} onChange={setTableAlignment} />
                        <NumberInput value={numOfTicks} onChange={(e) => setNumOfTicks(e)} />
                    </div>
                </div>
                <div className={`m-1 ${tableAlignment === 'H' ? 'flex flex-row-reverse' : ''}`}>
                    <div className="flex flex-1 flex-col-reverse">{orderBookTable(groupedOrderBook.asks, 'asks')}</div>
                    <div className="my-1" />
                    <div className={`${tableAlignment === 'H' ? 'flex flex-col-reverse flex-1' : ''}`}>
                        {orderBookTable(groupedOrderBook.bids, 'bids')}
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderBookTable;
