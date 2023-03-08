import {useEffect, useMemo, useState} from 'react';

import {useDepthSnapshot, useStreamTicker} from '../api';
import type {UpdateOrderBookPropsType} from '../types';

const OrderBook = () => {
    const streamTicker = useStreamTicker('BTCUSDT');
    const depthSnapshot = useDepthSnapshot('BTCUSDT', !!streamTicker?.data?.a);
    const [previousOrderBookUpdateId, setPreviousOrderBookUpdateId] = useState(0);
    const [firstEventProcessed, setFirstEventProcessed] = useState(false);
    const [numOfOrderBookRows, setNumOfOrderBookRows] = useState(10);
    const [groupByNum, setGroupByNum] = useState(3);
    const [hashOrderBookAsks, setHashOrderBookAsks] = useState(
        depthSnapshot?.data?.asks.reduce((acc, [price, quantity]) => {
            acc[price] = quantity;
            return acc;
        }, {} as Record<string, string>) || {},
    );
    // const [hashOrderBookAsks, setHashOrderBookAsks] = useState(
    //     Object.fromEntries(depthSnapshot?.data?.asks || ([] as string[][])),
    // );
    const [hashOrderBookBids, setHashOrderBookBids] = useState(
        depthSnapshot?.data?.bids.reduce((acc, [price, quantity]) => {
            acc[price] = quantity;
            return acc;
        }, {} as Record<string, string>) || {},
    );

    const updateOrderBook = (props: UpdateOrderBookPropsType) => {
        const {getter, setter, newStream} = props;
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
            Object.entries(updatedStateGetter).reduce((acc: Record<string, string>, [price, quantity]) => {
                acc[price] = quantity;
                return acc;
            }, {}),
        );
    };

    useEffect(() => {
        if (streamTicker?.data?.a) {
            if (streamTicker?.data?.u <= (depthSnapshot?.data?.lastUpdateId || 0)) return;

            if (!firstEventProcessed) {
                if (!(streamTicker?.data?.U <= (depthSnapshot?.data?.lastUpdateId || 0) + 1)) return;
                if (!(streamTicker?.data?.u >= (depthSnapshot?.data?.lastUpdateId || 0) + 1)) return;
                setFirstEventProcessed(true);
            }

            setPreviousOrderBookUpdateId(streamTicker?.data?.u || 0);
            if (streamTicker?.data?.U !== (previousOrderBookUpdateId || 0) + 1) return;

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
        }
    }, [streamTicker?.data?.u]);

    /////////////////////
    ////// ASKS ////////
    ///////////////////
    const groupedOrderBookAsks = Object.entries(hashOrderBookAsks).reduce(
        (acc: Record<string, string>, [priceStr, value]) => {
            const price = Math.ceil(parseFloat(priceStr) / groupByNum) * groupByNum;
            acc[price] = (Number(acc[price] || 0) + parseFloat(value)).toString();
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
                            className="grid grid-cols-2 mb-0.5"
                            style={{
                                background: `linear-gradient(90deg, rgba(198, 6, 6, 0.55) ${percentage}%, rgba(255, 255, 255, 0) 0%)`,
                            }}
                            key={price + quantity + index}
                        >
                            <div>{price}</div>
                            <div>{quantity}</div>
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
            acc[price] = (Number(acc[price] || 0) + parseFloat(value)).toString();
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
                            className="grid grid-cols-2 mb-0.5"
                            style={{
                                background: `linear-gradient(90deg, rgba(0, 185, 9, 0.55) ${percentage}%, rgba(255, 255, 255, 0) 0%)`,
                            }}
                            key={index}
                        >
                            <div>{price}</div>
                            <div>{quantity}</div>
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
            <div className="flex flex-col-reverse mb-4">{orderBookAsksTable}</div>
            <div>{orderBookBidsTable}</div>
        </div>
    );
};

export default OrderBook;
// --COLOR-alert: rgba(255,213,6,1);
// --COLOR-bg: rgba(0,0,0,1);
// --COLOR-cta: rgba(54,61,82,1);
// --COLOR-long: rgba(0,185,9,1);
// --COLOR-short: rgba(198,6,6,1);
// --COLOR-text: rgba(178,178,178,1);
// --COLOR-channel: rgba(89,106,131,1);
// --COLOR-guide: rgba(36,36,36,1);
// --COLOR-crosshair: rgba(71,71,71,1);
// --COLOR-taLines1: rgba(224,153,81,1);
// --COLOR-taLines2: rgba(120,221,228,1);
// --COLOR-taLines3: rgba(126,49,84,1);
// --COLOR-taLines4: rgba(104,157,97,1);
// --COLOR-taLines5: rgba(65,84,129,1);
// --COLOR-transparentize-channel-75: rgba(89,106,131,0.25);
// --COLOR-alertHighlight: rgba(255,219,56,1);
// --COLOR-ctaHighlight: rgba(75,84,114,1);
// --COLOR-longFill: rgba(0,133,4,1);
// --COLOR-longHighlight: rgba(0,235,8,1);
// --COLOR-shortFill: rgba(148,5,5,1);
// --COLOR-shortHighlight: rgba(247,8,8,1);
// --COLOR-textStrong: rgba(204,204,204,1);
// --COLOR-textWeak: rgba(140,140,140,1);
// --COLOR-textWeaker: rgba(102,102,102,1);
// --COLOR-z-bg-2: rgba(5,5,5,1);
// --COLOR-z-bg-5: rgba(13,13,13,1);
// --COLOR-z-bg-8: rgba(20,20,20,1);
// --COLOR-z-bg-10: rgba(26,26,26,1);
// --COLOR-z-bg-15: rgba(38,38,38,1);
// --COLOR-z-bg-20: rgba(51,51,51,1);
// --COLOR-taSenkouSpanA: rgba(0,82,3,1);
// --COLOR-taSenkouSpanB: rgba(99,3,3,1);
// --COLOR-text-on-action: rgba(178,178,178,1);
// --COLOR-text-on-alert: rgba(0,0,0,1);
// --COLOR-text-on-long: rgba(0,0,0,1);
// --COLOR-text-on-short: rgba(178,178,178,1);
// --COLOR-text-alert-10: rgba(247,210,23,1);
// --COLOR-text-alert-20: rgba(240,206,40,1);
// --COLOR-text-alert-30: rgba(232,203,58,1);
// --COLOR-text-alert-40: rgba(224,199,75,1);
// --COLOR-text-alert-50: rgba(217,196,92,1);
// --COLOR-text-alert-60: rgba(209,192,109,1);
// --COLOR-text-alert-70: rgba(201,189,126,1);
// --COLOR-text-alert-80: rgba(193,185,144,1);
// --COLOR-text-alert-90: rgba(186,182,161,1);
// --COLOR-text-cta-10: rgba(66,73,92,1);
// --COLOR-text-cta-20: rgba(79,84,101,1);
// --COLOR-text-cta-30: rgba(91,96,111,1);
// --COLOR-text-cta-40: rgba(104,108,120,1);
// --COLOR-text-cta-50: rgba(116,120,130,1);
// --COLOR-text-cta-60: rgba(128,131,140,1);
// --COLOR-text-cta-70: rgba(141,143,149,1);
// --COLOR-text-cta-80: rgba(153,155,159,1);
// --COLOR-text-cta-90: rgba(166,166,168,1);
// --COLOR-text-long-10: rgba(18,184,26,1);
// --COLOR-text-long-20: rgba(36,184,43,1);
// --COLOR-text-long-30: rgba(53,183,60,1);
// --COLOR-text-long-40: rgba(71,182,77,1);
// --COLOR-text-long-50: rgba(89,182,94,1);
// --COLOR-text-long-60: rgba(107,181,110,1);
// --COLOR-text-long-70: rgba(125,180,127,1);
// --COLOR-text-long-80: rgba(142,179,144,1);
// --COLOR-text-long-90: rgba(160,179,161,1);
// --COLOR-text-short-10: rgba(196,23,23,1);
// --COLOR-text-short-20: rgba(194,40,40,1);
// --COLOR-text-short-30: rgba(192,58,58,1);
// --COLOR-text-short-40: rgba(190,75,75,1);
// --COLOR-text-short-50: rgba(188,92,92,1);
// --COLOR-text-short-60: rgba(186,109,109,1);
// --COLOR-text-short-70: rgba(184,126,126,1);
// --COLOR-text-short-80: rgba(182,144,144,1);
// --COLOR-text-short-90: rgba(180,161,161,1);
// --COLOR-text-bg-10: rgba(18,18,18,1);
// --COLOR-text-bg-20: rgba(36,36,36,1);
// --COLOR-text-bg-30: rgba(53,53,53,1);
// --COLOR-text-bg-40: rgba(71,71,71,1);
// --COLOR-text-bg-50: rgba(89,89,89,1);
// --COLOR-text-bg-60: rgba(107,107,107,1);
// --COLOR-text-bg-70: rgba(125,125,125,1);
// --COLOR-text-bg-80: rgba(142,142,142,1);
// --COLOR-text-bg-90: rgba(160,160,160,1);
// --COLOR-text-channel-10: rgba(98,113,136,1);
// --COLOR-text-channel-20: rgba(107,120,140,1);
// --COLOR-text-channel-30: rgba(116,128,145,1);
// --COLOR-text-channel-40: rgba(125,135,150,1);
// --COLOR-text-channel-50: rgba(134,142,155,1);
// --COLOR-text-channel-60: rgba(142,149,159,1);
// --COLOR-text-channel-70: rgba(151,156,164,1);
// --COLOR-text-channel-80: rgba(160,164,169,1);
// --COLOR-text-channel-90: rgba(169,171,173,1);
// --COLOR-alert-cta-10: rgba(74,76,74,1);
// --COLOR-alert-cta-20: rgba(94,91,67,1);
// --COLOR-alert-cta-30: rgba(114,107,59,1);
// --COLOR-alert-cta-40: rgba(134,122,52,1);
// --COLOR-alert-cta-50: rgba(155,137,44,1);
// --COLOR-alert-cta-60: rgba(175,152,36,1);
// --COLOR-alert-cta-70: rgba(195,167,29,1);
// --COLOR-alert-cta-80: rgba(215,183,21,1);
// --COLOR-alert-cta-90: rgba(235,198,14,1);
// --COLOR-alert-long-10: rgba(26,188,9,1);
// --COLOR-alert-long-20: rgba(51,191,8,1);
// --COLOR-alert-long-30: rgba(77,193,8,1);
// --COLOR-alert-long-40: rgba(102,196,8,1);
// --COLOR-alert-long-50: rgba(128,199,8,1);
// --COLOR-alert-long-60: rgba(153,202,7,1);
// --COLOR-alert-long-70: rgba(179,205,7,1);
// --COLOR-alert-long-80: rgba(204,207,7,1);
// --COLOR-alert-long-90: rgba(230,210,6,1);
// --COLOR-alert-short-10: rgba(204,27,6,1);
// --COLOR-alert-short-20: rgba(209,47,6,1);
// --COLOR-alert-short-30: rgba(215,68,6,1);
// --COLOR-alert-short-40: rgba(221,89,6,1);
// --COLOR-alert-short-50: rgba(227,110,6,1);
// --COLOR-alert-short-60: rgba(232,130,6,1);
// --COLOR-alert-short-70: rgba(238,151,6,1);
// --COLOR-alert-short-80: rgba(244,172,6,1);
// --COLOR-alert-short-90: rgba(249,192,6,1);
// --COLOR-alert-bg-10: rgba(26,21,1,1);
// --COLOR-alert-bg-20: rgba(51,43,1,1);
// --COLOR-alert-bg-30: rgba(77,64,2,1);
// --COLOR-alert-bg-40: rgba(102,85,2,1);
// --COLOR-alert-bg-50: rgba(128,107,3,1);
// --COLOR-alert-bg-60: rgba(153,128,4,1);
// --COLOR-alert-bg-70: rgba(179,149,4,1);
// --COLOR-alert-bg-80: rgba(204,170,5,1);
// --COLOR-alert-bg-90: rgba(230,192,5,1);
// --COLOR-alert-channel-10: rgba(106,117,119,1);
// --COLOR-alert-channel-20: rgba(122,127,106,1);
// --COLOR-alert-channel-30: rgba(139,138,94,1);
// --COLOR-alert-channel-40: rgba(155,149,81,1);
// --COLOR-alert-channel-50: rgba(172,160,69,1);
// --COLOR-alert-channel-60: rgba(189,170,56,1);
// --COLOR-alert-channel-70: rgba(205,181,44,1);
// --COLOR-alert-channel-80: rgba(222,192,31,1);
// --COLOR-alert-channel-90: rgba(238,202,19,1);
// --COLOR-cta-long-10: rgba(5,173,16,1);
// --COLOR-cta-long-20: rgba(11,160,24,1);
// --COLOR-cta-long-30: rgba(16,148,31,1);
// --COLOR-cta-long-40: rgba(22,135,38,1);
// --COLOR-cta-long-50: rgba(27,123,46,1);
// --COLOR-cta-long-60: rgba(32,111,53,1);
// --COLOR-cta-long-70: rgba(38,98,60,1);
// --COLOR-cta-long-80: rgba(43,86,67,1);
// --COLOR-cta-long-90: rgba(49,73,75,1);
// --COLOR-cta-short-10: rgba(184,12,14,1);
// --COLOR-cta-short-20: rgba(169,17,21,1);
// --COLOR-cta-short-30: rgba(155,23,29,1);
// --COLOR-cta-short-40: rgba(140,28,36,1);
// --COLOR-cta-short-50: rgba(126,34,44,1);
// --COLOR-cta-short-60: rgba(112,39,52,1);
// --COLOR-cta-short-70: rgba(97,45,59,1);
// --COLOR-cta-short-80: rgba(83,50,67,1);
// --COLOR-cta-short-90: rgba(68,56,74,1);
// --COLOR-cta-bg-10: rgba(5,6,8,1);
// --COLOR-cta-bg-20: rgba(11,12,16,1);
// --COLOR-cta-bg-30: rgba(16,18,25,1);
// --COLOR-cta-bg-40: rgba(22,24,33,1);
// --COLOR-cta-bg-50: rgba(27,31,41,1);
// --COLOR-cta-bg-60: rgba(32,37,49,1);
// --COLOR-cta-bg-70: rgba(38,43,57,1);
// --COLOR-cta-bg-80: rgba(43,49,66,1);
// --COLOR-cta-bg-90: rgba(49,55,74,1);
// --COLOR-cta-channel-10: rgba(86,102,126,1);
// --COLOR-cta-channel-20: rgba(82,97,121,1);
// --COLOR-cta-channel-30: rgba(79,93,116,1);
// --COLOR-cta-channel-40: rgba(75,88,111,1);
// --COLOR-cta-channel-50: rgba(72,84,107,1);
// --COLOR-cta-channel-60: rgba(68,79,102,1);
// --COLOR-cta-channel-70: rgba(65,75,97,1);
// --COLOR-cta-channel-80: rgba(61,70,92,1);
// --COLOR-cta-channel-90: rgba(58,66,87,1);
// --COLOR-long-short-10: rgba(178,24,6,1);
// --COLOR-long-short-20: rgba(158,42,7,1);
// --COLOR-long-short-30: rgba(139,60,7,1);
// --COLOR-long-short-40: rgba(119,78,7,1);
// --COLOR-long-short-50: rgba(99,96,8,1);
// --COLOR-long-short-60: rgba(79,113,8,1);
// --COLOR-long-short-70: rgba(59,131,8,1);
// --COLOR-long-short-80: rgba(40,149,8,1);
// --COLOR-long-short-90: rgba(20,167,9,1);
// --COLOR-long-bg-10: rgba(0,19,1,1);
// --COLOR-long-bg-20: rgba(0,37,2,1);
// --COLOR-long-bg-30: rgba(0,56,3,1);
// --COLOR-long-bg-40: rgba(0,74,4,1);
// --COLOR-long-bg-50: rgba(0,93,5,1);
// --COLOR-long-bg-60: rgba(0,111,5,1);
// --COLOR-long-bg-70: rgba(0,130,6,1);
// --COLOR-long-bg-80: rgba(0,148,7,1);
// --COLOR-long-bg-90: rgba(0,167,8,1);
// --COLOR-long-channel-10: rgba(80,114,119,1);
// --COLOR-long-channel-20: rgba(71,122,107,1);
// --COLOR-long-channel-30: rgba(62,130,94,1);
// --COLOR-long-channel-40: rgba(53,138,82,1);
// --COLOR-long-channel-50: rgba(45,146,70,1);
// --COLOR-long-channel-60: rgba(36,153,58,1);
// --COLOR-long-channel-70: rgba(27,161,46,1);
// --COLOR-long-channel-80: rgba(18,169,33,1);
// --COLOR-long-channel-90: rgba(9,177,21,1);
// --COLOR-short-bg-10: rgba(20,1,1,1);
// --COLOR-short-bg-20: rgba(40,1,1,1);
// --COLOR-short-bg-30: rgba(59,2,2,1);
// --COLOR-short-bg-40: rgba(79,2,2,1);
// --COLOR-short-bg-50: rgba(99,3,3,1);
// --COLOR-short-bg-60: rgba(119,4,4,1);
// --COLOR-short-bg-70: rgba(139,4,4,1);
// --COLOR-short-bg-80: rgba(158,5,5,1);
// --COLOR-short-bg-90: rgba(178,5,5,1);
// --COLOR-short-channel-10: rgba(100,96,119,1);
// --COLOR-short-channel-20: rgba(111,86,106,1);
// --COLOR-short-channel-30: rgba(122,76,94,1);
// --COLOR-short-channel-40: rgba(133,66,81,1);
// --COLOR-short-channel-50: rgba(144,56,69,1);
// --COLOR-short-channel-60: rgba(154,46,56,1);
// --COLOR-short-channel-70: rgba(165,36,44,1);
// --COLOR-short-channel-80: rgba(176,26,31,1);
// --COLOR-short-channel-90: rgba(187,16,19,1);
// --COLOR-bg-channel-10: rgba(80,95,118,1);
// --COLOR-bg-channel-20: rgba(71,85,105,1);
// --COLOR-bg-channel-30: rgba(62,74,92,1);
// --COLOR-bg-channel-40: rgba(53,64,79,1);
// --COLOR-bg-channel-50: rgba(45,53,66,1);
// --COLOR-bg-channel-60: rgba(36,42,52,1);
// --COLOR-bg-channel-70: rgba(27,32,39,1);
// --COLOR-bg-channel-80: rgba(18,21,26,1);
// --COLOR-bg-channel-90: rgba(9,11,13,1);
// --COLOR-darken-text-2: rgba(173,173,173,1);
// --COLOR-darken-text-5: rgba(166,166,166,1);
// --COLOR-darken-text-8: rgba(158,158,158,1);
// --COLOR-darken-text-10: rgba(153,153,153,1);
// --COLOR-darken-text-15: rgba(140,140,140,1);
// --COLOR-darken-text-20: rgba(128,128,128,1);
// --COLOR-darken-text-25: rgba(115,115,115,1);
// --COLOR-darken-text-30: rgba(102,102,102,1);
// --COLOR-darken-text-35: rgba(89,89,89,1);
// --COLOR-darken-text-40: rgba(77,77,77,1);
// --COLOR-darken-text-45: rgba(64,64,64,1);
// --COLOR-darken-text-50: rgba(51,51,51,1);
// --COLOR-darken-text-55: rgba(38,38,38,1);
// --COLOR-darken-text-60: rgba(26,26,26,1);
// --COLOR-darken-text-65: rgba(13,13,13,1);
// --COLOR-darken-text-70: rgba(0,0,0,1);
// --COLOR-darken-text-75: rgba(0,0,0,1);
// --COLOR-darken-text-80: rgba(0,0,0,1);
// --COLOR-darken-text-85: rgba(0,0,0,1);
// --COLOR-darken-text-90: rgba(0,0,0,1);
// --COLOR-darken-text-95: rgba(0,0,0,1);
// --COLOR-darken-alert-2: rgba(250,204,0,1);
// --COLOR-darken-alert-5: rgba(235,192,0,1);
// --COLOR-darken-alert-8: rgba(219,179,0,1);
// --COLOR-darken-alert-10: rgba(209,171,0,1);
// --COLOR-darken-alert-15: rgba(184,150,0,1);
// --COLOR-darken-alert-20: rgba(158,129,0,1);
// --COLOR-darken-alert-25: rgba(133,108,0,1);
// --COLOR-darken-alert-30: rgba(107,87,0,1);
// --COLOR-darken-alert-35: rgba(82,67,0,1);
// --COLOR-darken-alert-40: rgba(56,46,0,1);
// --COLOR-darken-alert-45: rgba(31,25,0,1);
// --COLOR-darken-alert-50: rgba(5,4,0,1);
// --COLOR-darken-alert-55: rgba(0,0,0,1);
// --COLOR-darken-alert-60: rgba(0,0,0,1);
// --COLOR-darken-alert-65: rgba(0,0,0,1);
// --COLOR-darken-alert-70: rgba(0,0,0,1);
// --COLOR-darken-alert-75: rgba(0,0,0,1);
// --COLOR-darken-alert-80: rgba(0,0,0,1);
// --COLOR-darken-alert-85: rgba(0,0,0,1);
// --COLOR-darken-alert-90: rgba(0,0,0,1);
// --COLOR-darken-alert-95: rgba(0,0,0,1);
// --COLOR-darken-cta-2: rgba(50,57,77,1);
// --COLOR-darken-cta-5: rgba(44,50,68,1);
// --COLOR-darken-cta-8: rgba(38,43,59,1);
// --COLOR-darken-cta-10: rgba(34,39,52,1);
// --COLOR-darken-cta-15: rgba(24,27,37,1);
// --COLOR-darken-cta-20: rgba(14,16,22,1);
// --COLOR-darken-cta-25: rgba(4,5,6,1);
// --COLOR-darken-cta-30: rgba(0,0,0,1);
// --COLOR-darken-cta-35: rgba(0,0,0,1);
// --COLOR-darken-cta-40: rgba(0,0,0,1);
// --COLOR-darken-cta-45: rgba(0,0,0,1);
// --COLOR-darken-cta-50: rgba(0,0,0,1);
// --COLOR-darken-cta-55: rgba(0,0,0,1);
// --COLOR-darken-cta-60: rgba(0,0,0,1);
// --COLOR-darken-cta-65: rgba(0,0,0,1);
// --COLOR-darken-cta-70: rgba(0,0,0,1);
// --COLOR-darken-cta-75: rgba(0,0,0,1);
// --COLOR-darken-cta-80: rgba(0,0,0,1);
// --COLOR-darken-cta-85: rgba(0,0,0,1);
// --COLOR-darken-cta-90: rgba(0,0,0,1);
// --COLOR-darken-cta-95: rgba(0,0,0,1);
// --COLOR-darken-long-2: rgba(0,173,6,1);
// --COLOR-darken-long-5: rgba(0,158,5,1);
// --COLOR-darken-long-8: rgba(0,143,5,1);
// --COLOR-darken-long-10: rgba(0,133,4,1);
// --COLOR-darken-long-15: rgba(0,107,4,1);
// --COLOR-darken-long-20: rgba(0,82,3,1);
// --COLOR-darken-long-25: rgba(0,56,2,1);
// --COLOR-darken-long-30: rgba(0,31,1,1);
// --COLOR-darken-long-35: rgba(0,5,0,1);
// --COLOR-darken-long-40: rgba(0,0,0,1);
// --COLOR-darken-long-45: rgba(0,0,0,1);
// --COLOR-darken-long-50: rgba(0,0,0,1);
// --COLOR-darken-long-55: rgba(0,0,0,1);
// --COLOR-darken-long-60: rgba(0,0,0,1);
// --COLOR-darken-long-65: rgba(0,0,0,1);
// --COLOR-darken-long-70: rgba(0,0,0,1);
// --COLOR-darken-long-75: rgba(0,0,0,1);
// --COLOR-darken-long-80: rgba(0,0,0,1);
// --COLOR-darken-long-85: rgba(0,0,0,1);
// --COLOR-darken-long-90: rgba(0,0,0,1);
// --COLOR-darken-long-95: rgba(0,0,0,1);
// --COLOR-darken-short-2: rgba(188,6,6,1);
// --COLOR-darken-short-5: rgba(173,5,5,1);
// --COLOR-darken-short-8: rgba(158,5,5,1);
// --COLOR-darken-short-10: rgba(148,5,5,1);
// --COLOR-darken-short-15: rgba(124,4,4,1);
// --COLOR-darken-short-20: rgba(99,3,3,1);
// --COLOR-darken-short-25: rgba(74,2,2,1);
// --COLOR-darken-short-30: rgba(49,2,2,1);
// --COLOR-darken-short-35: rgba(25,1,1,1);
// --COLOR-darken-short-40: rgba(0,0,0,1);
// --COLOR-darken-short-45: rgba(0,0,0,1);
// --COLOR-darken-short-50: rgba(0,0,0,1);
// --COLOR-darken-short-55: rgba(0,0,0,1);
// --COLOR-darken-short-60: rgba(0,0,0,1);
// --COLOR-darken-short-65: rgba(0,0,0,1);
// --COLOR-darken-short-70: rgba(0,0,0,1);
// --COLOR-darken-short-75: rgba(0,0,0,1);
// --COLOR-darken-short-80: rgba(0,0,0,1);
// --COLOR-darken-short-85: rgba(0,0,0,1);
// --COLOR-darken-short-90: rgba(0,0,0,1);
// --COLOR-darken-short-95: rgba(0,0,0,1);
// --COLOR-darken-bg-2: rgba(0,0,0,1);
// --COLOR-darken-bg-5: rgba(0,0,0,1);
// --COLOR-darken-bg-8: rgba(0,0,0,1);
// --COLOR-darken-bg-10: rgba(0,0,0,1);
// --COLOR-darken-bg-15: rgba(0,0,0,1);
// --COLOR-darken-bg-20: rgba(0,0,0,1);
// --COLOR-darken-bg-25: rgba(0,0,0,1);
// --COLOR-darken-bg-30: rgba(0,0,0,1);
// --COLOR-darken-bg-35: rgba(0,0,0,1);
// --COLOR-darken-bg-40: rgba(0,0,0,1);
// --COLOR-darken-bg-45: rgba(0,0,0,1);
// --COLOR-darken-bg-50: rgba(0,0,0,1);
// --COLOR-darken-bg-55: rgba(0,0,0,1);
// --COLOR-darken-bg-60: rgba(0,0,0,1);
// --COLOR-darken-bg-65: rgba(0,0,0,1);
// --COLOR-darken-bg-70: rgba(0,0,0,1);
// --COLOR-darken-bg-75: rgba(0,0,0,1);
// --COLOR-darken-bg-80: rgba(0,0,0,1);
// --COLOR-darken-bg-85: rgba(0,0,0,1);
// --COLOR-darken-bg-90: rgba(0,0,0,1);
// --COLOR-darken-bg-95: rgba(0,0,0,1);
// --COLOR-darken-channel-2: rgba(85,101,124,1);
// --COLOR-darken-channel-5: rgba(78,94,115,1);
// --COLOR-darken-channel-8: rgba(72,86,106,1);
// --COLOR-darken-channel-10: rgba(68,81,100,1);
// --COLOR-darken-channel-15: rgba(58,69,85,1);
// --COLOR-darken-channel-20: rgba(48,57,70,1);
// --COLOR-darken-channel-25: rgba(37,44,55,1);
// --COLOR-darken-channel-30: rgba(27,32,39,1);
// --COLOR-darken-channel-35: rgba(17,20,24,1);
// --COLOR-darken-channel-40: rgba(6,7,9,1);
// --COLOR-darken-channel-45: rgba(0,0,0,1);
// --COLOR-darken-channel-50: rgba(0,0,0,1);
// --COLOR-darken-channel-55: rgba(0,0,0,1);
// --COLOR-darken-channel-60: rgba(0,0,0,1);
// --COLOR-darken-channel-65: rgba(0,0,0,1);
// --COLOR-darken-channel-70: rgba(0,0,0,1);
// --COLOR-darken-channel-75: rgba(0,0,0,1);
// --COLOR-darken-channel-80: rgba(0,0,0,1);
// --COLOR-darken-channel-85: rgba(0,0,0,1);
// --COLOR-darken-channel-90: rgba(0,0,0,1);
// --COLOR-darken-channel-95: rgba(0,0,0,1);
// --COLOR-lighten-text-2: rgba(184,184,184,1);
// --COLOR-lighten-text-5: rgba(191,191,191,1);
// --COLOR-lighten-text-8: rgba(199,199,199,1);
// --COLOR-lighten-text-10: rgba(204,204,204,1);
// --COLOR-lighten-text-15: rgba(217,217,217,1);
// --COLOR-lighten-text-20: rgba(230,230,230,1);
// --COLOR-lighten-text-25: rgba(242,242,242,1);
// --COLOR-lighten-text-30: rgba(255,255,255,1);
// --COLOR-lighten-text-35: rgba(255,255,255,1);
// --COLOR-lighten-text-40: rgba(255,255,255,1);
// --COLOR-lighten-text-45: rgba(255,255,255,1);
// --COLOR-lighten-text-50: rgba(255,255,255,1);
// --COLOR-lighten-text-55: rgba(255,255,255,1);
// --COLOR-lighten-text-60: rgba(255,255,255,1);
// --COLOR-lighten-text-65: rgba(255,255,255,1);
// --COLOR-lighten-text-70: rgba(255,255,255,1);
// --COLOR-lighten-text-75: rgba(255,255,255,1);
// --COLOR-lighten-text-80: rgba(255,255,255,1);
// --COLOR-lighten-text-85: rgba(255,255,255,1);
// --COLOR-lighten-text-90: rgba(255,255,255,1);
// --COLOR-lighten-text-95: rgba(255,255,255,1);
// --COLOR-lighten-alert-2: rgba(255,211,15,1);
// --COLOR-lighten-alert-5: rgba(255,214,31,1);
// --COLOR-lighten-alert-8: rgba(255,217,46,1);
// --COLOR-lighten-alert-10: rgba(255,219,56,1);
// --COLOR-lighten-alert-15: rgba(255,223,82,1);
// --COLOR-lighten-alert-20: rgba(255,228,107,1);
// --COLOR-lighten-alert-25: rgba(255,233,133,1);
// --COLOR-lighten-alert-30: rgba(255,237,158,1);
// --COLOR-lighten-alert-35: rgba(255,242,184,1);
// --COLOR-lighten-alert-40: rgba(255,247,209,1);
// --COLOR-lighten-alert-45: rgba(255,251,235,1);
// --COLOR-lighten-alert-50: rgba(255,255,255,1);
// --COLOR-lighten-alert-55: rgba(255,255,255,1);
// --COLOR-lighten-alert-60: rgba(255,255,255,1);
// --COLOR-lighten-alert-65: rgba(255,255,255,1);
// --COLOR-lighten-alert-70: rgba(255,255,255,1);
// --COLOR-lighten-alert-75: rgba(255,255,255,1);
// --COLOR-lighten-alert-80: rgba(255,255,255,1);
// --COLOR-lighten-alert-85: rgba(255,255,255,1);
// --COLOR-lighten-alert-90: rgba(255,255,255,1);
// --COLOR-lighten-alert-95: rgba(255,255,255,1);
// --COLOR-lighten-cta-2: rgba(58,66,89,1);
// --COLOR-lighten-cta-5: rgba(64,73,99,1);
// --COLOR-lighten-cta-8: rgba(71,80,108,1);
// --COLOR-lighten-cta-10: rgba(75,84,114,1);
// --COLOR-lighten-cta-15: rgba(85,96,130,1);
// --COLOR-lighten-cta-20: rgba(95,107,145,1);
// --COLOR-lighten-cta-25: rgba(107,120,158,1);
// --COLOR-lighten-cta-30: rgba(122,134,168,1);
// --COLOR-lighten-cta-35: rgba(138,148,178,1);
// --COLOR-lighten-cta-40: rgba(153,162,189,1);
// --COLOR-lighten-cta-45: rgba(169,176,199,1);
// --COLOR-lighten-cta-50: rgba(184,190,209,1);
// --COLOR-lighten-cta-55: rgba(199,204,219,1);
// --COLOR-lighten-cta-60: rgba(215,218,229,1);
// --COLOR-lighten-cta-65: rgba(230,232,239,1);
// --COLOR-lighten-cta-70: rgba(246,247,249,1);
// --COLOR-lighten-cta-75: rgba(255,255,255,1);
// --COLOR-lighten-cta-80: rgba(255,255,255,1);
// --COLOR-lighten-cta-85: rgba(255,255,255,1);
// --COLOR-lighten-cta-90: rgba(255,255,255,1);
// --COLOR-lighten-cta-95: rgba(255,255,255,1);
// --COLOR-lighten-long-2: rgba(0,194,6,1);
// --COLOR-lighten-long-5: rgba(0,209,7,1);
// --COLOR-lighten-long-8: rgba(0,224,7,1);
// --COLOR-lighten-long-10: rgba(0,235,8,1);
// --COLOR-lighten-long-15: rgba(5,255,13,1);
// --COLOR-lighten-long-20: rgba(31,255,38,1);
// --COLOR-lighten-long-25: rgba(56,255,63,1);
// --COLOR-lighten-long-30: rgba(82,255,87,1);
// --COLOR-lighten-long-35: rgba(107,255,112,1);
// --COLOR-lighten-long-40: rgba(133,255,137,1);
// --COLOR-lighten-long-45: rgba(158,255,161,1);
// --COLOR-lighten-long-50: rgba(184,255,186,1);
// --COLOR-lighten-long-55: rgba(209,255,211,1);
// --COLOR-lighten-long-60: rgba(235,255,235,1);
// --COLOR-lighten-long-65: rgba(255,255,255,1);
// --COLOR-lighten-long-70: rgba(255,255,255,1);
// --COLOR-lighten-long-75: rgba(255,255,255,1);
// --COLOR-lighten-long-80: rgba(255,255,255,1);
// --COLOR-lighten-long-85: rgba(255,255,255,1);
// --COLOR-lighten-long-90: rgba(255,255,255,1);
// --COLOR-lighten-long-95: rgba(255,255,255,1);
// --COLOR-lighten-short-2: rgba(208,6,6,1);
// --COLOR-lighten-short-5: rgba(223,7,7,1);
// --COLOR-lighten-short-8: rgba(237,7,7,1);
// --COLOR-lighten-short-10: rgba(247,8,8,1);
// --COLOR-lighten-short-15: rgba(248,32,32,1);
// --COLOR-lighten-short-20: rgba(249,57,57,1);
// --COLOR-lighten-short-25: rgba(250,82,82,1);
// --COLOR-lighten-short-30: rgba(250,107,107,1);
// --COLOR-lighten-short-35: rgba(251,131,131,1);
// --COLOR-lighten-short-40: rgba(252,156,156,1);
// --COLOR-lighten-short-45: rgba(253,181,181,1);
// --COLOR-lighten-short-50: rgba(253,206,206,1);
// --COLOR-lighten-short-55: rgba(254,230,230,1);
// --COLOR-lighten-short-60: rgba(255,255,255,1);
// --COLOR-lighten-short-65: rgba(255,255,255,1);
// --COLOR-lighten-short-70: rgba(255,255,255,1);
// --COLOR-lighten-short-75: rgba(255,255,255,1);
// --COLOR-lighten-short-80: rgba(255,255,255,1);
// --COLOR-lighten-short-85: rgba(255,255,255,1);
// --COLOR-lighten-short-90: rgba(255,255,255,1);
// --COLOR-lighten-short-95: rgba(255,255,255,1);
// --COLOR-lighten-bg-2: rgba(5,5,5,1);
// --COLOR-lighten-bg-5: rgba(13,13,13,1);
// --COLOR-lighten-bg-8: rgba(20,20,20,1);
// --COLOR-lighten-bg-10: rgba(26,26,26,1);
// --COLOR-lighten-bg-15: rgba(38,38,38,1);
// --COLOR-lighten-bg-20: rgba(51,51,51,1);
// --COLOR-lighten-bg-25: rgba(64,64,64,1);
// --COLOR-lighten-bg-30: rgba(77,77,77,1);
// --COLOR-lighten-bg-35: rgba(89,89,89,1);
// --COLOR-lighten-bg-40: rgba(102,102,102,1);
// --COLOR-lighten-bg-45: rgba(115,115,115,1);
// --COLOR-lighten-bg-50: rgba(128,128,128,1);
// --COLOR-lighten-bg-55: rgba(140,140,140,1);
// --COLOR-lighten-bg-60: rgba(153,153,153,1);
// --COLOR-lighten-bg-65: rgba(166,166,166,1);
// --COLOR-lighten-bg-70: rgba(179,179,179,1);
// --COLOR-lighten-bg-75: rgba(191,191,191,1);
// --COLOR-lighten-bg-80: rgba(204,204,204,1);
// --COLOR-lighten-bg-85: rgba(217,217,217,1);
// --COLOR-lighten-bg-90: rgba(230,230,230,1);
// --COLOR-lighten-bg-95: rgba(242,242,242,1);
// --COLOR-lighten-channel-2: rgba(93,111,137,1);
// --COLOR-lighten-channel-5: rgba(99,119,146,1);
// --COLOR-lighten-channel-8: rgba(106,126,154,1);
// --COLOR-lighten-channel-10: rgba(112,131,158,1);
// --COLOR-lighten-channel-15: rgba(128,145,168,1);
// --COLOR-lighten-channel-20: rgba(143,158,179,1);
// --COLOR-lighten-channel-25: rgba(158,171,189,1);
// --COLOR-lighten-channel-30: rgba(173,184,199,1);
// --COLOR-lighten-channel-35: rgba(188,197,210,1);
// --COLOR-lighten-channel-40: rgba(203,210,220,1);
// --COLOR-lighten-channel-45: rgba(219,223,230,1);
// --COLOR-lighten-channel-50: rgba(234,237,241,1);
// --COLOR-lighten-channel-55: rgba(249,250,251,1);
// --COLOR-lighten-channel-60: rgba(255,255,255,1);
// --COLOR-lighten-channel-65: rgba(255,255,255,1);
// --COLOR-lighten-channel-70: rgba(255,255,255,1);
// --COLOR-lighten-channel-75: rgba(255,255,255,1);
// --COLOR-lighten-channel-80: rgba(255,255,255,1);
// --COLOR-lighten-channel-85: rgba(255,255,255,1);
// --COLOR-lighten-channel-90: rgba(255,255,255,1);
// --COLOR-lighten-channel-95: rgba(255,255,255,1);
// --COLOR-rgba-text-0: rgba(178,178,178,0);
// --COLOR-rgba-text-2: rgba(178,178,178,0.02);
// --COLOR-rgba-text-5: rgba(178,178,178,0.05);
// --COLOR-rgba-text-8: rgba(178,178,178,0.08);
// --COLOR-rgba-text-10: rgba(178,178,178,0.1);
// --COLOR-rgba-text-15: rgba(178,178,178,0.15);
// --COLOR-rgba-text-20: rgba(178,178,178,0.2);
// --COLOR-rgba-text-25: rgba(178,178,178,0.25);
// --COLOR-rgba-text-30: rgba(178,178,178,0.3);
// --COLOR-rgba-text-35: rgba(178,178,178,0.35);
// --COLOR-rgba-text-40: rgba(178,178,178,0.4);
// --COLOR-rgba-text-45: rgba(178,178,178,0.45);
// --COLOR-rgba-text-50: rgba(178,178,178,0.5);
// --COLOR-rgba-text-55: rgba(178,178,178,0.55);
// --COLOR-rgba-text-60: rgba(178,178,178,0.6);
// --COLOR-rgba-text-65: rgba(178,178,178,0.65);
// --COLOR-rgba-text-70: rgba(178,178,178,0.7);
// --COLOR-rgba-text-75: rgba(178,178,178,0.75);
// --COLOR-rgba-text-80: rgba(178,178,178,0.8);
// --COLOR-rgba-text-85: rgba(178,178,178,0.85);
// --COLOR-rgba-text-90: rgba(178,178,178,0.9);
// --COLOR-rgba-text-95: rgba(178,178,178,0.95);
// --COLOR-rgba-alert-0: rgba(255,213,6,0);
// --COLOR-rgba-alert-2: rgba(255,213,6,0.02);
// --COLOR-rgba-alert-5: rgba(255,213,6,0.05);
// --COLOR-rgba-alert-8: rgba(255,213,6,0.08);
// --COLOR-rgba-alert-10: rgba(255,213,6,0.1);
// --COLOR-rgba-alert-15: rgba(255,213,6,0.15);
// --COLOR-rgba-alert-20: rgba(255,213,6,0.2);
// --COLOR-rgba-alert-25: rgba(255,213,6,0.25);
// --COLOR-rgba-alert-30: rgba(255,213,6,0.3);
// --COLOR-rgba-alert-35: rgba(255,213,6,0.35);
// --COLOR-rgba-alert-40: rgba(255,213,6,0.4);
// --COLOR-rgba-alert-45: rgba(255,213,6,0.45);
// --COLOR-rgba-alert-50: rgba(255,213,6,0.5);
// --COLOR-rgba-alert-55: rgba(255,213,6,0.55);
// --COLOR-rgba-alert-60: rgba(255,213,6,0.6);
// --COLOR-rgba-alert-65: rgba(255,213,6,0.65);
// --COLOR-rgba-alert-70: rgba(255,213,6,0.7);
// --COLOR-rgba-alert-75: rgba(255,213,6,0.75);
// --COLOR-rgba-alert-80: rgba(255,213,6,0.8);
// --COLOR-rgba-alert-85: rgba(255,213,6,0.85);
// --COLOR-rgba-alert-90: rgba(255,213,6,0.9);
// --COLOR-rgba-alert-95: rgba(255,213,6,0.95);
// --COLOR-rgba-cta-0: rgba(54,61,82,0);
// --COLOR-rgba-cta-2: rgba(54,61,82,0.02);
// --COLOR-rgba-cta-5: rgba(54,61,82,0.05);
// --COLOR-rgba-cta-8: rgba(54,61,82,0.08);
// --COLOR-rgba-cta-10: rgba(54,61,82,0.1);
// --COLOR-rgba-cta-15: rgba(54,61,82,0.15);
// --COLOR-rgba-cta-20: rgba(54,61,82,0.2);
// --COLOR-rgba-cta-25: rgba(54,61,82,0.25);
// --COLOR-rgba-cta-30: rgba(54,61,82,0.3);
// --COLOR-rgba-cta-35: rgba(54,61,82,0.35);
// --COLOR-rgba-cta-40: rgba(54,61,82,0.4);
// --COLOR-rgba-cta-45: rgba(54,61,82,0.45);
// --COLOR-rgba-cta-50: rgba(54,61,82,0.5);
// --COLOR-rgba-cta-55: rgba(54,61,82,0.55);
// --COLOR-rgba-cta-60: rgba(54,61,82,0.6);
// --COLOR-rgba-cta-65: rgba(54,61,82,0.65);
// --COLOR-rgba-cta-70: rgba(54,61,82,0.7);
// --COLOR-rgba-cta-75: rgba(54,61,82,0.75);
// --COLOR-rgba-cta-80: rgba(54,61,82,0.8);
// --COLOR-rgba-cta-85: rgba(54,61,82,0.85);
// --COLOR-rgba-cta-90: rgba(54,61,82,0.9);
// --COLOR-rgba-cta-95: rgba(54,61,82,0.95);
// --COLOR-rgba-long-0: rgba(0,185,9,0);
// --COLOR-rgba-long-2: rgba(0,185,9,0.02);
// --COLOR-rgba-long-5: rgba(0,185,9,0.05);
// --COLOR-rgba-long-8: rgba(0,185,9,0.08);
// --COLOR-rgba-long-10: rgba(0,185,9,0.1);
// --COLOR-rgba-long-15: rgba(0,185,9,0.15);
// --COLOR-rgba-long-20: rgba(0,185,9,0.2);
// --COLOR-rgba-long-25: rgba(0,185,9,0.25);
// --COLOR-rgba-long-30: rgba(0,185,9,0.3);
// --COLOR-rgba-long-35: rgba(0,185,9,0.35);
// --COLOR-rgba-long-40: rgba(0,185,9,0.4);
// --COLOR-rgba-long-45: rgba(0,185,9,0.45);
// --COLOR-rgba-long-50: rgba(0,185,9,0.5);
// --COLOR-rgba-long-55: rgba(0,185,9,0.55);
// --COLOR-rgba-long-60: rgba(0,185,9,0.6);
// --COLOR-rgba-long-65: rgba(0,185,9,0.65);
// --COLOR-rgba-long-70: rgba(0,185,9,0.7);
// --COLOR-rgba-long-75: rgba(0,185,9,0.75);
// --COLOR-rgba-long-80: rgba(0,185,9,0.8);
// --COLOR-rgba-long-85: rgba(0,185,9,0.85);
// --COLOR-rgba-long-90: rgba(0,185,9,0.9);
// --COLOR-rgba-long-95: rgba(0,185,9,0.95);
// --COLOR-rgba-short-0: rgba(198,6,6,0);
// --COLOR-rgba-short-2: rgba(198,6,6,0.02);
// --COLOR-rgba-short-5: rgba(198,6,6,0.05);
// --COLOR-rgba-short-8: rgba(198,6,6,0.08);
// --COLOR-rgba-short-10: rgba(198,6,6,0.1);
// --COLOR-rgba-short-15: rgba(198,6,6,0.15);
// --COLOR-rgba-short-20: rgba(198,6,6,0.2);
// --COLOR-rgba-short-25: rgba(198,6,6,0.25);
// --COLOR-rgba-short-30: rgba(198,6,6,0.3);
// --COLOR-rgba-short-35: rgba(198,6,6,0.35);
// --COLOR-rgba-short-40: rgba(198,6,6,0.4);
// --COLOR-rgba-short-45: rgba(198,6,6,0.45);
// --COLOR-rgba-short-50: rgba(198,6,6,0.5);
// --COLOR-rgba-short-55: rgba(198,6,6,0.55);
// --COLOR-rgba-short-60: rgba(198,6,6,0.6);
// --COLOR-rgba-short-65: rgba(198,6,6,0.65);
// --COLOR-rgba-short-70: rgba(198,6,6,0.7);
// --COLOR-rgba-short-75: rgba(198,6,6,0.75);
// --COLOR-rgba-short-80: rgba(198,6,6,0.8);
// --COLOR-rgba-short-85: rgba(198,6,6,0.85);
// --COLOR-rgba-short-90: rgba(198,6,6,0.9);
// --COLOR-rgba-short-95: rgba(198,6,6,0.95);
// --COLOR-rgba-bg-0: rgba(0,0,0,0);
// --COLOR-rgba-bg-2: rgba(0,0,0,0.02);
// --COLOR-rgba-bg-5: rgba(0,0,0,0.05);
// --COLOR-rgba-bg-8: rgba(0,0,0,0.08);
// --COLOR-rgba-bg-10: rgba(0,0,0,0.1);
// --COLOR-rgba-bg-15: rgba(0,0,0,0.15);
// --COLOR-rgba-bg-20: rgba(0,0,0,0.2);
// --COLOR-rgba-bg-25: rgba(0,0,0,0.25);
// --COLOR-rgba-bg-30: rgba(0,0,0,0.3);
// --COLOR-rgba-bg-35: rgba(0,0,0,0.35);
// --COLOR-rgba-bg-40: rgba(0,0,0,0.4);
// --COLOR-rgba-bg-45: rgba(0,0,0,0.45);
// --COLOR-rgba-bg-50: rgba(0,0,0,0.5);
// --COLOR-rgba-bg-55: rgba(0,0,0,0.55);
// --COLOR-rgba-bg-60: rgba(0,0,0,0.6);
// --COLOR-rgba-bg-65: rgba(0,0,0,0.65);
// --COLOR-rgba-bg-70: rgba(0,0,0,0.7);
// --COLOR-rgba-bg-75: rgba(0,0,0,0.75);
// --COLOR-rgba-bg-80: rgba(0,0,0,0.8);
// --COLOR-rgba-bg-85: rgba(0,0,0,0.85);
// --COLOR-rgba-bg-90: rgba(0,0,0,0.9);
// --COLOR-rgba-bg-95: rgba(0,0,0,0.95);
// --COLOR-rgba-channel-0: rgba(89,106,131,0);
// --COLOR-rgba-channel-2: rgba(89,106,131,0.02);
// --COLOR-rgba-channel-5: rgba(89,106,131,0.05);
// --COLOR-rgba-channel-8: rgba(89,106,131,0.08);
// --COLOR-rgba-channel-10: rgba(89,106,131,0.1);
// --COLOR-rgba-channel-15: rgba(89,106,131,0.15);
// --COLOR-rgba-channel-20: rgba(89,106,131,0.2);
// --COLOR-rgba-channel-25: rgba(89,106,131,0.25);
// --COLOR-rgba-channel-30: rgba(89,106,131,0.3);
// --COLOR-rgba-channel-35: rgba(89,106,131,0.35);
// --COLOR-rgba-channel-40: rgba(89,106,131,0.4);
// --COLOR-rgba-channel-45: rgba(89,106,131,0.45);
// --COLOR-rgba-channel-50: rgba(89,106,131,0.5);
// --COLOR-rgba-channel-55: rgba(89,106,131,0.55);
// --COLOR-rgba-channel-60: rgba(89,106,131,0.6);
// --COLOR-rgba-channel-65: rgba(89,106,131,0.65);
// --COLOR-rgba-channel-70: rgba(89,106,131,0.7);
// --COLOR-rgba-channel-75: rgba(89,106,131,0.75);
// --COLOR-rgba-channel-80: rgba(89,106,131,0.8);
// --COLOR-rgba-channel-85: rgba(89,106,131,0.85);
// --COLOR-rgba-channel-90: rgba(89,106,131,0.9);
// --COLOR-rgba-channel-95: rgba(89,106,131,0.95);
// --COLOR-rgba-textStrong-0: rgba(204,204,204,0);
// --COLOR-rgba-textStrong-2: rgba(204,204,204,0.02);
// --COLOR-rgba-textStrong-5: rgba(204,204,204,0.05);
// --COLOR-rgba-textStrong-8: rgba(204,204,204,0.08);
// --COLOR-rgba-textStrong-10: rgba(204,204,204,0.1);
// --COLOR-rgba-textStrong-15: rgba(204,204,204,0.15);
// --COLOR-rgba-textStrong-20: rgba(204,204,204,0.2);
// --COLOR-rgba-textStrong-25: rgba(204,204,204,0.25);
// --COLOR-rgba-textStrong-30: rgba(204,204,204,0.3);
// --COLOR-rgba-textStrong-35: rgba(204,204,204,0.35);
// --COLOR-rgba-textStrong-40: rgba(204,204,204,0.4);
// --COLOR-rgba-textStrong-45: rgba(204,204,204,0.45);
// --COLOR-rgba-textStrong-50: rgba(204,204,204,0.5);
// --COLOR-rgba-textStrong-55: rgba(204,204,204,0.55);
// --COLOR-rgba-textStrong-60: rgba(204,204,204,0.6);
// --COLOR-rgba-textStrong-65: rgba(204,204,204,0.65);
// --COLOR-rgba-textStrong-70: rgba(204,204,204,0.7);
// --COLOR-rgba-textStrong-75: rgba(204,204,204,0.75);
// --COLOR-rgba-textStrong-80: rgba(204,204,204,0.8);
// --COLOR-rgba-textStrong-85: rgba(204,204,204,0.85);
// --COLOR-rgba-textStrong-90: rgba(204,204,204,0.9);
// --COLOR-rgba-textStrong-95: rgba(204,204,204,0.95);
// --COLOR-rgba-textWeak-0: rgba(140,140,140,0);
// --COLOR-rgba-textWeak-2: rgba(140,140,140,0.02);
// --COLOR-rgba-textWeak-5: rgba(140,140,140,0.05);
// --COLOR-rgba-textWeak-8: rgba(140,140,140,0.08);
// --COLOR-rgba-textWeak-10: rgba(140,140,140,0.1);
// --COLOR-rgba-textWeak-15: rgba(140,140,140,0.15);
// --COLOR-rgba-textWeak-20: rgba(140,140,140,0.2);
// --COLOR-rgba-textWeak-25: rgba(140,140,140,0.25);
// --COLOR-rgba-textWeak-30: rgba(140,140,140,0.3);
// --COLOR-rgba-textWeak-35: rgba(140,140,140,0.35);
// --COLOR-rgba-textWeak-40: rgba(140,140,140,0.4);
// --COLOR-rgba-textWeak-45: rgba(140,140,140,0.45);
// --COLOR-rgba-textWeak-50: rgba(140,140,140,0.5);
// --COLOR-rgba-textWeak-55: rgba(140,140,140,0.55);
// --COLOR-rgba-textWeak-60: rgba(140,140,140,0.6);
// --COLOR-rgba-textWeak-65: rgba(140,140,140,0.65);
// --COLOR-rgba-textWeak-70: rgba(140,140,140,0.7);
// --COLOR-rgba-textWeak-75: rgba(140,140,140,0.75);
// --COLOR-rgba-textWeak-80: rgba(140,140,140,0.8);
// --COLOR-rgba-textWeak-85: rgba(140,140,140,0.85);
// --COLOR-rgba-textWeak-90: rgba(140,140,140,0.9);
// --COLOR-rgba-textWeak-95: rgba(140,140,140,0.95);
// --COLOR-rgba-shortFill-0: rgba(148,5,5,0);
// --COLOR-rgba-shortFill-2: rgba(148,5,5,0.02);
// --COLOR-rgba-shortFill-5: rgba(148,5,5,0.05);
// --COLOR-rgba-shortFill-8: rgba(148,5,5,0.08);
// --COLOR-rgba-shortFill-10: rgba(148,5,5,0.1);
// --COLOR-rgba-shortFill-15: rgba(148,5,5,0.15);
// --COLOR-rgba-shortFill-20: rgba(148,5,5,0.2);
// --COLOR-rgba-shortFill-25: rgba(148,5,5,0.25);
// --COLOR-rgba-shortFill-30: rgba(148,5,5,0.3);
// --COLOR-rgba-shortFill-35: rgba(148,5,5,0.35);
// --COLOR-rgba-shortFill-40: rgba(148,5,5,0.4);
// --COLOR-rgba-shortFill-45: rgba(148,5,5,0.45);
// --COLOR-rgba-shortFill-50: rgba(148,5,5,0.5);
// --COLOR-rgba-shortFill-55: rgba(148,5,5,0.55);
// --COLOR-rgba-shortFill-60: rgba(148,5,5,0.6);
// --COLOR-rgba-shortFill-65: rgba(148,5,5,0.65);
// --COLOR-rgba-shortFill-70: rgba(148,5,5,0.7);
// --COLOR-rgba-shortFill-75: rgba(148,5,5,0.75);
// --COLOR-rgba-shortFill-80: rgba(148,5,5,0.8);
// --COLOR-rgba-shortFill-85: rgba(148,5,5,0.85);
// --COLOR-rgba-shortFill-90: rgba(148,5,5,0.9);
// --COLOR-rgba-shortFill-95: rgba(148,5,5,0.95);
// --COLOR-rgba-longFill-0: rgba(0,133,4,0);
// --COLOR-rgba-longFill-2: rgba(0,133,4,0.02);
// --COLOR-rgba-longFill-5: rgba(0,133,4,0.05);
// --COLOR-rgba-longFill-8: rgba(0,133,4,0.08);
// --COLOR-rgba-longFill-10: rgba(0,133,4,0.1);
// --COLOR-rgba-longFill-15: rgba(0,133,4,0.15);
// --COLOR-rgba-longFill-20: rgba(0,133,4,0.2);
// --COLOR-rgba-longFill-25: rgba(0,133,4,0.25);
// --COLOR-rgba-longFill-30: rgba(0,133,4,0.3);
// --COLOR-rgba-longFill-35: rgba(0,133,4,0.35);
// --COLOR-rgba-longFill-40: rgba(0,133,4,0.4);
// --COLOR-rgba-longFill-45: rgba(0,133,4,0.45);
// --COLOR-rgba-longFill-50: rgba(0,133,4,0.5);
// --COLOR-rgba-longFill-55: rgba(0,133,4,0.55);
// --COLOR-rgba-longFill-60: rgba(0,133,4,0.6);
// --COLOR-rgba-longFill-65: rgba(0,133,4,0.65);
// --COLOR-rgba-longFill-70: rgba(0,133,4,0.7);
// --COLOR-rgba-longFill-75: rgba(0,133,4,0.75);
// --COLOR-rgba-longFill-80: rgba(0,133,4,0.8);
// --COLOR-rgba-longFill-85: rgba(0,133,4,0.85);
// --COLOR-rgba-longFill-90: rgba(0,133,4,0.9);
// --COLOR-rgba-longFill-95: rgba(0,133,4,0.95);
// --COLOR-rgba-ctaHighlight-0: rgba(75,84,114,0);
// --COLOR-rgba-ctaHighlight-2: rgba(75,84,114,0.02);
// --COLOR-rgba-ctaHighlight-5: rgba(75,84,114,0.05);
// --COLOR-rgba-ctaHighlight-8: rgba(75,84,114,0.08);
// --COLOR-rgba-ctaHighlight-10: rgba(75,84,114,0.1);
// --COLOR-rgba-ctaHighlight-15: rgba(75,84,114,0.15);
// --COLOR-rgba-ctaHighlight-20: rgba(75,84,114,0.2);
// --COLOR-rgba-ctaHighlight-25: rgba(75,84,114,0.25);
// --COLOR-rgba-ctaHighlight-30: rgba(75,84,114,0.3);
// --COLOR-rgba-ctaHighlight-35: rgba(75,84,114,0.35);
// --COLOR-rgba-ctaHighlight-40: rgba(75,84,114,0.4);
// --COLOR-rgba-ctaHighlight-45: rgba(75,84,114,0.45);
// --COLOR-rgba-ctaHighlight-50: rgba(75,84,114,0.5);
// --COLOR-rgba-ctaHighlight-55: rgba(75,84,114,0.55);
// --COLOR-rgba-ctaHighlight-60: rgba(75,84,114,0.6);
// --COLOR-rgba-ctaHighlight-65: rgba(75,84,114,0.65);
// --COLOR-rgba-ctaHighlight-70: rgba(75,84,114,0.7);
// --COLOR-rgba-ctaHighlight-75: rgba(75,84,114,0.75);
// --COLOR-rgba-ctaHighlight-80: rgba(75,84,114,0.8);
// --COLOR-rgba-ctaHighlight-85: rgba(75,84,114,0.85);
// --COLOR-rgba-ctaHighlight-90: rgba(75,84,114,0.9);
// --COLOR-rgba-ctaHighlight-95: rgba(75,84,114,0.95);
// --COLOR-borderMid: rgba(53,53,53,1);
// --COLOR-borderStrong: rgba(71,71,71,1);
// --COLOR-borderWeak: rgba(36,36,36,1);
// --COLOR-borderWeaker: rgba(18,18,18,1);
// --COLOR-ctaWeak: rgba(32,37,49,1);
// --COLOR-errorBg: rgba(119,4,4,1);
// --COLOR-cta-bg-2: rgba(1,1,2,1);
// --COLOR-cta-bg-5: rgba(3,3,4,1);
// --COLOR-cta-bg-8: rgba(4,5,7,1);
// --COLOR-cta-bg-15: rgba(8,9,12,1);
// --COLOR-text-bg-2: rgba(4,4,4,1);
// --COLOR-text-bg-5: rgba(9,9,9,1);
// --COLOR-text-bg-8: rgba(14,14,14,1);
// --COLOR-text-bg-15: rgba(27,27,27,1);
// --COLOR-text-ctaHighlight-20: rgba(96,103,127,1);
// --COLOR-textWeak-alert-90: rgba(152,147,127,1);
// --COLOR-long-desaturated: rgba(92,92,92,1);
// --COLOR-short-desaturated: rgba(102,102,102,1);
// --COLOR-text-desaturated: rgba(179,179,179,1);
// --COLOR-alert-borderWeak-10: rgba(58,54,33,1);
// --COLOR-cta-borderWeak-50: rgba(45,49,59,1);
// --COLOR-cta-borderWeak-70: rgba(49,54,68,1);
// --COLOR-cta-borderWeak-75: rgba(50,55,71,1);
// --COLOR-long-borderWeak-30: rgba(25,81,28,1);
// --COLOR-short-borderWeak-30: rgba(85,27,27,1);
// --COLOR-shortRgba20-desaturated: rgba(102,102,102,0.2);
// --COLOR-shortRgba50-desaturated: rgba(102,102,102,0.5);
// --COLOR-rgba-borderWeak-50: rgba(36,36,36,0.5);
// --COLOR-rgba-ctaWeak-40: rgba(32,37,49,0.4);
// --COLOR-rgba-ctaWeak-50: rgba(32,37,49,0.5);
// --COLOR-rgba-ctaWeak-60: rgba(32,37,49,0.6);
// --COLOR-rgba-ctaWeak-70: rgba(32,37,49,0.7);
// --COLOR-rgba-errorBg-10: rgba(119,4,4,0.1);
// --COLOR-rgba-errorBg-65: rgba(119,4,4,0.65);
// --COLOR-rgba-errorBg-75: rgba(119,4,4,0.75);
// --COLOR-rgba-errorBg-85: rgba(119,4,4,0.85);
// --COLOR-rgba-errorBg-90: rgba(119,4,4,0.9);
// --COLOR-rgba-errorBg-95: rgba(119,4,4,0.95);
// --COLOR-alertDim: rgba(255,213,6,0.45);
// --COLOR-ctaDim: rgba(54,61,82,0.45);
// --COLOR-longDim: rgba(0,185,9,0.45);
// --COLOR-shortDim: rgba(198,6,6,0.45);
// --COLOR-textDim: rgba(178,178,178,0.45);
// --COLOR-text-strong: rgba(204,204,204,1);
// --COLOR-text-primary: rgba(178,178,178,1);
// --COLOR-text-mid: rgba(142,142,142,1);
// --COLOR-text-weak: rgba(107,107,107,1);
// --COLOR-text-weaker: rgba(71,71,71,1);
// --COLOR-text-dim: rgba(36,36,36,1);
// --COLOR-cta-highlight: rgba(75,84,114,1);
// --COLOR-cta-primary: rgba(54,61,82,1);
// --COLOR-cta-mid: rgba(43,49,66,1);
// --COLOR-cta-weak: rgba(32,37,49,1);
// --COLOR-cta-weaker: rgba(22,24,33,1);
// --COLOR-cta-dim: rgba(11,12,16,1);
// --COLOR-alert-highlight: rgba(255,219,56,1);
// --COLOR-alert-primary: rgba(255,213,6,1);
// --COLOR-alert-mid: rgba(204,170,5,1);
// --COLOR-alert-weak: rgba(153,128,4,1);
// --COLOR-alert-weaker: rgba(102,85,2,1);
// --COLOR-alert-dim: rgba(51,43,1,1);
// --COLOR-short-highlight: rgba(247,8,8,1);
// --COLOR-short-primary: rgba(198,6,6,1);
// --COLOR-short-mid: rgba(158,5,5,1);
// --COLOR-short-weak: rgba(119,4,4,1);
// --COLOR-short-weaker: rgba(79,2,2,1);
// --COLOR-short-dim: rgba(40,1,1,1);
// --COLOR-long-highlight: rgba(0,235,8,1);
// --COLOR-long-primary: rgba(0,185,9,1);
// --COLOR-long-mid: rgba(0,148,7,1);
// --COLOR-long-weak: rgba(0,111,5,1);
// --COLOR-long-weaker: rgba(0,74,4,1);
// --COLOR-long-dim: rgba(0,37,2,1);
// --COLOR-channel-primary: rgba(89,106,131,1);
// --COLOR-border-strong: rgba(71,71,71,1);
// --COLOR-border-mid: rgba(53,53,53,1);
// --COLOR-border-weak: rgba(36,36,36,1);
// --COLOR-border-weaker: rgba(18,18,18,1);
