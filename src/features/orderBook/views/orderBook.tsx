import {useEffect, useState, SetStateAction} from 'react';

import OrderBookTable from '../components/OrderBookTable';
import Tape from '../components/Tape';
// import OrderBookDepth from '../components/OrderBookDepth';
import OrderBookFilters from '../components/OrderBookFilters';
import {useDepthSnapshot, useStreamTicker, useStreamAggTrade} from '../api';
import type {UpdateOrderBookPropsType, StreamTickerResponseType} from '../types';

const OrderBook = () => {
    const streamTicker = useStreamTicker('BTCUSDT');
    // const streamAggTrade = useStreamAggTrade('BTCUSDT');
    const depthSnapshot = useDepthSnapshot('BTCUSDT', !!streamTicker?.data?.a);

    const [previousOrderBookUpdateId, setPreviousOrderBookUpdateId] = useState(0);
    const [firstEventProcessed, setFirstEventProcessed] = useState(false);
    const [numOfOrderBookRows, setNumOfOrderBookRows] = useState(10);
    const [groupByNum, setGroupByNum] = useState(1);
    const [tempOrderBookData, setTempOrderBookData] = useState<StreamTickerResponseType[]>([]);
    const [tempOrderBookDataConsumed, setTempOrderBookDataConsumed] = useState(false);
    const [orderBookAsks, setOrderBookAsks] = useState<[string, string][]>([]);
    const [orderBookBids, setOrderBookBids] = useState<[string, string][]>([]);
    const [groupedOrderBookAsks, setGroupedOrderBookAsks] = useState([]);
    const [groupedOrderBookBids, setGroupedOrderBookBids] = useState([]);

    const useUpdateOrderBookWorker = (): ((props: UpdateOrderBookPropsType) => void) => {
        const [worker, setWorker] = useState<Worker | null>(null);

        useEffect(() => {
            const newWorker = new Worker(new URL('../workers/orderBookWorker.ts', import.meta.url));
            setWorker(newWorker);

            return () => newWorker.terminate();
        }, []);

        return (props: UpdateOrderBookPropsType) => {
            if (!worker) return;

            worker.postMessage({
                type: 'UPDATE_ORDER_BOOK',
                groupByNum,
                payload: props,
            });

            worker.onmessage = (event) => {
                const {type, payload} = event.data;
                const {updatedAsks, updatedBids, groupedAsks, groupedBids} = payload;
                if (type === 'ORDER_BOOK_UPDATED') {
                    setOrderBookBids(updatedBids);
                    setOrderBookAsks(updatedAsks);
                    setGroupedOrderBookAsks(groupedAsks);
                    setGroupedOrderBookBids(groupedBids);
                }
            };
        };
    };

    const updateOrderBook = useUpdateOrderBookWorker();

    useEffect(() => {
        setOrderBookAsks(depthSnapshot?.data?.asks as SetStateAction<[string, string][]>);
        setOrderBookBids(depthSnapshot?.data?.bids as SetStateAction<[string, string][]>);
    }, [depthSnapshot?.data?.lastUpdateId]);

    useEffect(() => {
        if (depthSnapshot.isLoading) {
            if (streamTicker?.data?.u) setTempOrderBookData((prev) => [...prev, streamTicker?.data]);
            return;
        } else if (!tempOrderBookDataConsumed) {
            for (let i = 0; i < tempOrderBookData.length; i++) {
                if (!tempOrderBookData[i]?.u || !depthSnapshot?.data?.lastUpdateId) continue;
                if (tempOrderBookData[i]?.u <= depthSnapshot?.data?.lastUpdateId) continue;

                if (!firstEventProcessed) {
                    if (!(tempOrderBookData[i]?.U <= depthSnapshot?.data?.lastUpdateId + 1)) continue;
                    if (!(tempOrderBookData[i]?.u >= depthSnapshot?.data?.lastUpdateId + 1)) continue;
                    setFirstEventProcessed(true);
                }

                setPreviousOrderBookUpdateId(tempOrderBookData[i]?.u);
                if (streamTicker?.data?.U !== previousOrderBookUpdateId + 1) continue;

                updateOrderBook({
                    asksGetter: orderBookAsks,
                    bidsGetter: orderBookBids,
                    asksStream: tempOrderBookData[i]?.a,
                    bidsStream: tempOrderBookData[i]?.b,
                });
            }
            setTempOrderBookDataConsumed(true);
        }

        if (
            !depthSnapshot?.data?.lastUpdateId ||
            !streamTicker?.data?.u ||
            streamTicker?.data?.u <= depthSnapshot?.data?.lastUpdateId
        )
            return;

        if (!firstEventProcessed) {
            if (!(streamTicker?.data?.U <= depthSnapshot?.data?.lastUpdateId + 1)) return;
            if (!(streamTicker?.data?.u >= depthSnapshot?.data?.lastUpdateId + 1)) return;
            setFirstEventProcessed(true);
        }

        setPreviousOrderBookUpdateId(streamTicker?.data?.u);
        if (streamTicker?.data?.U !== previousOrderBookUpdateId + 1) return;

        updateOrderBook({
            asksGetter: orderBookAsks,
            bidsGetter: orderBookBids,
            asksStream: streamTicker?.data?.a,
            bidsStream: streamTicker?.data?.b,
        });
    }, [streamTicker?.data?.u]);

    if (!firstEventProcessed) return <>Loading...</>;

    return (
        <>
            <OrderBookFilters
                numOfOrderBookRows={numOfOrderBookRows}
                setNumOfOrderBookRows={setNumOfOrderBookRows}
                groupByNum={groupByNum}
                setGroupByNum={setGroupByNum}
            />
            <OrderBookTable
                groupedAsks={groupedOrderBookAsks}
                groupedBids={groupedOrderBookBids}
                numOfOrderBookRows={numOfOrderBookRows}
                streamAggTradePrice={''}
            />
            <Tape streamAggTrade={''} />
            {/* <OrderBookDepth groupedAsks={groupedOrderBookAsks} groupedBids={groupedOrderBookBids} /> */}
        </>
    );
};

export default OrderBook;
