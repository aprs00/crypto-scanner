import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';
import CSSelect from '@/components/UI/CSSelect';
import CSSpinner from '@/components/UI/CSSpinner';
import NumberInput from '@/components/UI/NumberInput';
import {formatNumber} from '@/utils/number';

import {OrderBookResponseType, StreamTickerResponseType} from '../types';
import {tableBackgroundStyle} from '../utils';
import {groupOrders, updateOrderBook} from '../utils';

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

    const ws = useRef<WebSocket | null>(null);
    const eventBuffer = useRef<StreamTickerResponseType[]>([]);
    const firstEventU = useRef<number | null>(null);
    const orderBookRef = useRef<OrderBookResponseType>({bids: [], asks: [], lastUpdateId: 0});
    const symbol = 'btcusdt';

    const initialize = () => {
        eventBuffer.current = [];
        firstEventU.current = null;

        setOrderBook({bids: [], asks: [], lastUpdateId: 0});

        if (ws.current) {
            ws.current.close();
        }

        ws.current = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@depth@100ms`);

        if (!ws.current) return;

        ws.current.onopen = () => {};
        ws.current.onclose = () => {};
        ws.current.onerror = () => {};

        ws.current.onmessage = (event) => {
            const data: StreamTickerResponseType = JSON.parse(event.data);

            if (firstEventU.current === null && data.U) {
                firstEventU.current = data.U;
                fetchSnapshot();
            } else if (orderBookRef.current.lastUpdateId === 0) {
                eventBuffer.current.push(data);
            } else {
                processEvent(data);
            }
        };
    };

    const fetchSnapshot = async () => {
        try {
            const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=5000`);
            const data = await response.json();

            if (data.lastUpdateId < (firstEventU.current ?? 0)) {
                fetchSnapshot();
                return;
            }

            processSnapshot(data);
        } catch (error) {
            /* empty */
        }
    };

    const processSnapshot = (snapshot: OrderBookResponseType) => {
        const newOrderBook = {
            bids: snapshot.bids,
            asks: snapshot.asks,
            lastUpdateId: snapshot.lastUpdateId,
        };

        const validEvents = eventBuffer.current.filter((event) => event.u > snapshot.lastUpdateId);

        if (validEvents.length > 0) {
            const firstEvent: StreamTickerResponseType = validEvents[0];
            if (firstEvent.U <= snapshot.lastUpdateId + 1 && firstEvent.u >= snapshot.lastUpdateId + 1) {
                let currentBook = {...newOrderBook};

                validEvents.forEach((event) => {
                    currentBook = applyEvent(currentBook, event);
                });

                setOrderBook(currentBook);
                eventBuffer.current = [];
            } else {
                setTimeout(initialize, 1000);
                setOrderBook(newOrderBook);
            }
        } else {
            setOrderBook(newOrderBook);
        }
    };

    const processEvent = (event: StreamTickerResponseType) => {
        const updatedBook = applyEvent(orderBookRef.current, event);

        if (updatedBook.lastUpdateId !== orderBookRef.current.lastUpdateId) {
            setOrderBook(updatedBook);
        }
    };

    const applyEvent = (book: OrderBookResponseType, event: StreamTickerResponseType) => {
        if (event.u <= book.lastUpdateId) {
            return book;
        }

        if (event.U > book.lastUpdateId + 1) {
            setTimeout(initialize, 1000);
        }

        const {getter: updatedAsks} = updateOrderBook(book.asks, event.a, true);
        const {getter: updatedBids} = updateOrderBook(book.bids, event.b, false);

        return {
            asks: updatedAsks,
            bids: updatedBids,
            lastUpdateId: event.u,
        };
    };

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
        orderBookRef.current = orderBook;
    }, [orderBook]);

    useEffect(() => {
        if (!symbolTickSize || !orderBookRef.current.asks) return;

        setGroupedOrderBook({
            bids: groupOrders(orderBookRef.current.bids, groupByVal, false, calculatedNumOfRows),
            asks: groupOrders(orderBookRef.current.asks, groupByVal, true, calculatedNumOfRows),
        });
    }, [numOfTicks, calculatedNumOfRows, orderBook]);

    useEffect(() => {
        initialize();

        return () => {
            if (ws.current) {
                ws.current.close();
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
