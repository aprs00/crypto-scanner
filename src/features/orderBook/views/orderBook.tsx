import {useEffect, useMemo, useState} from 'react';

import {useDepthSnapshot, useStreamTicker, useStreamAggTrade} from '../api';
import type {UpdateOrderBookPropsType, StreamTickerResponseType} from '../types';

const OrderBook = () => {
    const streamTicker = useStreamTicker('BTCUSDT');
    const streamAggTrade = useStreamAggTrade('BTCUSDT');
    const depthSnapshot = useDepthSnapshot('BTCUSDT', !!streamTicker?.data?.a);

    const [previousOrderBookUpdateId, setPreviousOrderBookUpdateId] = useState(0);
    const [firstEventProcessed, setFirstEventProcessed] = useState(false);
    const [numOfOrderBookRows, setNumOfOrderBookRows] = useState(10);
    const [groupByNum, setGroupByNum] = useState(3);
    const [tempOrderBookData, setTempOrderBookData] = useState<StreamTickerResponseType[]>([]);
    const [tempOrderBookDataConsumed, setTempOrderBookDataConsumed] = useState(false);
    const [hashOrderBookAsks, setHashOrderBookAsks] = useState({});
    const [hashOrderBookBids, setHashOrderBookBids] = useState({});

    const updateOrderBook = (props: UpdateOrderBookPropsType) => {
        const {getter, setter, newStream} = props;
        const updatedStateGetter = {...getter};
        for (let i = 0; i < newStream.length; i++) {
            const [price, quantity] = newStream[i];
            if (quantity === '0.00000000') {
                delete updatedStateGetter[newStream[i][0]];
                continue;
            }
            updatedStateGetter[price] = quantity;
        }
        setter(
            Object.entries(updatedStateGetter).reduce((acc: Record<string, string>, [price, quantity]) => {
                acc[price] = quantity;
                return acc;
            }, {}),
        );
    };

    useEffect(() => {
        setHashOrderBookAsks(Object.fromEntries(depthSnapshot?.data?.asks || ([] as string[][])));
        setHashOrderBookBids(Object.fromEntries(depthSnapshot?.data?.bids || ([] as string[][])));
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
            getter: hashOrderBookAsks,
            setter: setHashOrderBookAsks,
            newStream: streamTicker?.data?.a,
        });
        updateOrderBook({
            getter: hashOrderBookBids,
            setter: setHashOrderBookBids,
            newStream: streamTicker?.data?.b,
        });
    }, [streamTicker?.data?.u]);

    /////////////////////
    ////// ASKS ////////
    ///////////////////
    const groupedOrderBookAsks = Object.entries(hashOrderBookAsks).reduce(
        (acc: Record<string, string>, [priceStr, value]) => {
            const price = Math.ceil(parseFloat(priceStr) / groupByNum) * groupByNum;
            acc[price] = (Number(acc[price] || 0) + parseFloat(value as string)).toString();
            return acc;
        },
        {},
    );

    const maxAsksQuantity = useMemo(
        () =>
            Object.entries(groupedOrderBookAsks)
                .slice(0, numOfOrderBookRows)
                .reduce((acc, [, quantity]) => Math.max(acc, Number(quantity)), 0),
        [previousOrderBookUpdateId],
    );

    const orderBookAsksTable = useMemo(
        () =>
            Object.entries(groupedOrderBookAsks)
                .slice(0, numOfOrderBookRows)
                .map(([price, quantity], index) => {
                    const percentage = (Number(quantity) / maxAsksQuantity) * 100;
                    return (
                        <div
                            className="grid grid-cols-2 mb-0.5 text-slate-200 text-sm p-0.5"
                            style={{
                                background: `linear-gradient(90deg, rgba(198, 6, 6, 0.55) ${percentage}%, rgba(255, 255, 255, 0) 0%)`,
                            }}
                            key={price + quantity + index}
                        >
                            <div>{price}</div>
                            <div>{Number(quantity).toPrecision(6)}</div>
                        </div>
                    );
                }),
        [previousOrderBookUpdateId],
    );

    /////////////////////
    ////// BIDS ////////
    ///////////////////
    const groupedOrderBookBids = Object.entries(hashOrderBookBids).reduce(
        (acc: Record<string, string>, [priceStr, value]) => {
            const price = Math.floor(parseFloat(priceStr) / groupByNum) * groupByNum;
            acc[price] = (Number(acc[price] || 0) + parseFloat(value as string) || 0).toString();
            return acc;
        },
        {},
    );

    const maxBidsQuantity = useMemo(
        () =>
            Object.entries(groupedOrderBookBids)
                .slice(-numOfOrderBookRows)
                .reverse()
                .reduce((acc, [, quantity]) => Math.max(acc, Number(quantity)), 0) || 0,
        [groupedOrderBookBids],
    );

    const orderBookBidsTable = useMemo(
        () =>
            Object.entries(groupedOrderBookBids)
                .slice(-numOfOrderBookRows)
                .reverse()
                .map(([price, quantity], index) => {
                    const percentage = (Number(quantity) / maxBidsQuantity) * 100;
                    return (
                        <div
                            className="grid grid-cols-2 mb-0.5 text-slate-200 text-sm p-0.5"
                            style={{
                                background: `linear-gradient(90deg, rgba(0, 185, 9, 0.55) ${percentage}%, rgba(255, 255, 255, 0) 0%)`,
                            }}
                            key={index}
                        >
                            <div>{price}</div>
                            <div>{Number(quantity).toPrecision(6)}</div>
                        </div>
                    );
                }),
        [previousOrderBookUpdateId],
    );

    if (!firstEventProcessed) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex space-x-4">
                <div>
                    <label htmlFor="num_of_rows" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Number of rows
                    </label>
                    <input
                        type="number"
                        id="num_of_rows"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg mb-10 focus:ring-blue-500 focus:border-blue-500 block p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 w-32"
                        value={numOfOrderBookRows}
                        onChange={(e) => setNumOfOrderBookRows(Number(e.target.value))}
                        placeholder="Number of rows"
                    />
                </div>
                <div>
                    <label htmlFor="num_of_rows" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                        Group By
                    </label>
                    <input
                        type="number"
                        id="num_of_rows"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg mb-10 focus:ring-blue-500 focus:border-blue-500 block p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 w-32"
                        value={groupByNum}
                        onChange={(e) => setGroupByNum(Number(e.target.value))}
                        placeholder="Group by"
                    />
                </div>
            </div>
            <div className="flex flex-col-reverse">{orderBookAsksTable}</div>
            <div className="my-4 text-xl">
                {parseFloat(streamAggTrade?.data?.p || '0')
                    .toString()
                    .replace(/\.?0+$/, '')}
            </div>
            <div>{orderBookBidsTable}</div>
        </div>
    );
};

export default OrderBook;
