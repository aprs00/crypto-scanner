import {useRef, useEffect, useState, SetStateAction} from 'react';
import RGL, {WidthProvider} from 'react-grid-layout';

import Spinner from '@/components/Spinner';
import Table from '../components/Table';
import Tape from '../components/Tape';
import OrderBookFilters from '../components/Filters';
import {useDepthSnapshot, useStreamTicker} from '../api';
import type {UpdateOrderBookPropsType, StreamTickerResponseType} from '../types';

const ResponsiveReactGridLayout = WidthProvider(RGL);

const GRID_LAYOUT_ROW_HEIGHT = 30;
const GRID_LAYOUT_TABLE_HEIGHT = 10;
const tableLayout = {x: 0, y: 0, w: 6, h: 10};
const tapeLayout = {x: 6, y: 0, w: 4, h: 10};

const OrderBook = () => {
    const streamTicker = useStreamTicker('BTCUSDT') as {data: StreamTickerResponseType};
    const depthSnapshot = useDepthSnapshot('BTCUSDT', !!streamTicker?.data?.a);

    const [previousOrderBookUpdateId, setPreviousOrderBookUpdateId] = useState(0);
    const [firstEventProcessed, setFirstEventProcessed] = useState(false);
    const [groupByNum, setGroupByNum] = useState(1);
    const [tempOrderBookData, setTempOrderBookData] = useState<StreamTickerResponseType[]>([]);
    const [tempOrderBookDataConsumed, setTempOrderBookDataConsumed] = useState(false);
    const [orderBookAsks, setOrderBookAsks] = useState<[string, string][]>([]);
    const [orderBookBids, setOrderBookBids] = useState<[string, string][]>([]);
    const [groupedOrderBookAsks, setGroupedOrderBookAsks] = useState([]);
    const [groupedOrderBookBids, setGroupedOrderBookBids] = useState([]);
    const [tableHeight, setTableHeight] = useState(GRID_LAYOUT_TABLE_HEIGHT * GRID_LAYOUT_ROW_HEIGHT);

    const tableRef = useRef<HTMLDivElement>(null);

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

                if (streamTicker?.data?.U !== previousOrderBookUpdateId + 1) continue;
                setPreviousOrderBookUpdateId(tempOrderBookData[i]?.u);

                updateOrderBook({
                    asksGetter: orderBookAsks,
                    bidsGetter: orderBookBids,
                    asksStream: tempOrderBookData[i]?.a,
                    bidsStream: tempOrderBookData[i]?.b,
                });
            }
            setTempOrderBookDataConsumed(true);
            return;
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

    useEffect(() => {
        if (tableRef.current) {
            console.log(tableRef.current);
        }
    }, [tableRef]);

    return (
        <>
            <OrderBookFilters groupByNum={groupByNum} setGroupByNum={setGroupByNum} />
            <ResponsiveReactGridLayout
                rowHeight={GRID_LAYOUT_ROW_HEIGHT}
                onResize={(grids) => {
                    grids.forEach((grid) => {
                        if (grid.i === 'table') {
                            setTableHeight(grid.h * GRID_LAYOUT_ROW_HEIGHT);
                        }
                    });
                }}
            >
                <div key="table" data-grid={tableLayout} className="bg-slate-900 overflow-hidden">
                    {firstEventProcessed ? (
                        <Table
                            groupedAsks={groupedOrderBookAsks}
                            groupedBids={groupedOrderBookBids}
                            tableHeight={tableHeight}
                        />
                    ) : (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <Spinner />
                        </div>
                    )}
                </div>
                <div key="tape" data-grid={tapeLayout} className="bg-slate-900 overflow-hidden">
                    <Tape />
                </div>
            </ResponsiveReactGridLayout>
        </>
    );
};

export default OrderBook;
