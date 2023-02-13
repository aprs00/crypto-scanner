import {useEffect, useMemo, useState} from 'react';

import {useDepthSnapshot, useStreamTicker} from '../api';
import type {UpdateOrderBookPropsType} from '../types';

const OrderBook = () => {
    const streamTicker = useStreamTicker('BTCUSDT');
    const depthSnapshot = useDepthSnapshot('BTCUSDT', !!streamTicker?.data?.a);
    const [previousOrderBookUpdateId, setPreviousOrderBookUpdateId] = useState(0); // u - Last update ID in event
    const [firstEventProcessed, setFirstEventProcessed] = useState(false);
    const [numOfOrderBookRows, setNumOfOrderBookRows] = useState(10);
    const [hashOrderBookAsks, setHashOrderBookAsks] = useState(
        depthSnapshot?.data?.asks.reduce((acc, [price, quantity]) => {
            acc[price] = quantity;
            return acc;
        }, {} as Record<string, string>) || {},
    );
    const [hashOrderBookBids, setHashOrderBookBids] = useState(
        depthSnapshot?.data?.bids.reduce((acc, [price, quantity]) => {
            acc[price] = quantity;
            return acc;
        }, {} as Record<string, string>) || {},
    );

    const updateOrderBook = (props: UpdateOrderBookPropsType) => {
        const {getter, setter, newStream, sortByAscending} = props;
        const updatedStateGetter = {...getter};
        for (let i = 0; i < newStream.length; i++) {
            if (newStream[i][1] === '0.00000000') {
                delete updatedStateGetter[newStream[i][0]];
                continue;
            }
            const [price, quantity] = newStream[i];
            updatedStateGetter[price] = quantity;
        }
        setter(
            Object.entries(updatedStateGetter)
                .sort((a, b) => (sortByAscending ? Number(a[0]) - Number(b[0]) : Number(b[0]) - Number(a[0])))
                .reduce((acc: Record<string, string>, [price, quantity]) => {
                    acc[price] = quantity;
                    return acc;
                }, {}),
        );
    };

    useEffect(() => {
        if (streamTicker?.data?.a) {
            if (streamTicker?.data?.u <= (depthSnapshot?.data?.lastUpdateId || 0)) return;

            if (!firstEventProcessed) {
                if (streamTicker?.data?.U > (depthSnapshot?.data?.lastUpdateId || 0) + 1) return;
                if (streamTicker?.data?.u < (depthSnapshot?.data?.lastUpdateId || 0) + 1) return;
                setFirstEventProcessed(true);
            }

            setPreviousOrderBookUpdateId(streamTicker?.data?.u || 0);
            if (streamTicker?.data?.U !== (previousOrderBookUpdateId || 0) + 1) return;

            updateOrderBook({
                getter: hashOrderBookAsks,
                setter: setHashOrderBookAsks,
                newStream: streamTicker?.data?.a,
                sortByAscending: true,
            });
            updateOrderBook({
                getter: hashOrderBookBids,
                setter: setHashOrderBookBids,
                newStream: streamTicker?.data?.b,
                sortByAscending: false,
            });
        }
    }, [streamTicker?.data?.u]);

    const maxAsksQuantity = useMemo(
        () =>
            Object.entries(hashOrderBookAsks)
                .slice(0, numOfOrderBookRows)
                .reduce((acc, [, quantity]) => Math.max(acc, Number(quantity)), 0),
        [streamTicker?.data?.u],
    );

    const orderBookAsksTable = useMemo(
        () =>
            Object.entries(hashOrderBookAsks)
                .slice(0, numOfOrderBookRows)
                .map(([price, quantity], index) => {
                    const percentage = (Number(quantity) / maxAsksQuantity) * 100;
                    return (
                        <div
                            className="grid grid-cols-2 gap-1"
                            style={{
                                background: `linear-gradient(90deg, rgb(255 0 0) ${percentage}%, rgba(255, 255, 255, 0) 0%)`,
                            }}
                            key={price + quantity + index}
                        >
                            <div>{price}</div>
                            <div>{quantity}</div>
                        </div>
                    );
                }),
        [streamTicker?.data?.u, depthSnapshot?.data?.lastUpdateId],
    );

    const maxBidsQuantity = useMemo(
        () =>
            Object.entries(hashOrderBookBids)
                .slice(0, numOfOrderBookRows)
                .reduce((acc, [, quantity]) => Math.max(acc, Number(quantity)), 0) || 0,
        [hashOrderBookBids],
    );

    const orderBookBidsTable = useMemo(
        () =>
            Object.entries(hashOrderBookBids)
                .slice(0, numOfOrderBookRows)
                .map(([price, quantity], index) => {
                    const percentage = (Number(quantity) / maxBidsQuantity) * 100;
                    return (
                        <div
                            className="grid grid-cols-2 gap-1 bg-slate-500"
                            style={{
                                background: `linear-gradient(90deg, rgb(22 163 74) ${percentage}%, rgba(255, 255, 255, 0) 0%)`,
                            }}
                            key={index}
                        >
                            <div>{price}</div>
                            <div>{quantity}</div>
                        </div>
                    );
                }),
        [streamTicker?.data?.u, depthSnapshot?.data?.lastUpdateId],
    );

    // const groupBy = (x) => (array) =>
    //     array.reduce((acc, [price, quantity]) => {
    //         const groupValue = Math.floor(Number(price) / x) * x;
    //         if (!acc[groupValue]) {
    //             acc[groupValue] = {price: groupValue, quantity: 0};
    //         }
    //         acc[groupValue].quantity += Number(quantity);
    //         return acc;
    //     }, {});

    // const orderBookBidsTable = useMemo(() => {
    //     const groupedBy10 = Object.values(groupBy(10)(Object.entries(hashOrderBookBids).reverse()));

    //     return groupedBy10
    //         .reverse()
    //         .slice(0, numOfOrderBookRows)
    //         .map(({price, quantity}, index) => {
    //             // const percentage = (Number(quantity) / maxBidsQuantity) * 100;
    //             const percentage = calculateMaxQuantity(groupedBy10);
    //             return (
    //                 <div
    //                     className="grid grid-cols-2 gap-1 bg-slate-500"
    //                     style={{
    //                         background: `linear-gradient(90deg, rgb(22 163 74) ${percentage}%, rgba(255, 255, 255, 0) 0%)`,
    //                     }}
    //                     key={price + index}
    //                 >
    //                     <div>{price}</div>
    //                     <div>{quantity}</div>
    //                 </div>
    //             );
    //         });
    // }, [streamTicker?.data?.u]);

    if (!firstEventProcessed) return <div>Loading...</div>;

    return (
        <div>
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
            <div className="flex flex-col-reverse">{orderBookAsksTable}</div>
            <hr className="my-5" />
            <div>{orderBookBidsTable}</div>
        </div>
    );
};

export default OrderBook;
