import {useEffect, useMemo, useState} from 'react';

import {useDepthSnapshot, useStreamTicker} from '../api';
import {homeRoute} from '@/features/home/routes';

export const orderBookRoute = homeRoute.createRoute({
    path: 'order-book',
    loader: async () => {
        return {};
    },
    component: () => {
        const depthSnapshot = useDepthSnapshot('BTCUSDT');
        const streamTicker = useStreamTicker('BTCUSDT');
        const [previousStreamTicker, setPreviousStreamTicker] = useState(streamTicker);
        let firstEventProcessed = false;
        // console.log(depthSnapshot?.data);

        const hashOrderBookAsks =
            depthSnapshot?.data?.asks.reduce((acc, [price, quantity]) => {
                acc[price] = quantity;
                return acc;
            }, {} as Record<string, string>) || {};

        const hashOrderBookBids =
            depthSnapshot?.data?.bids.reduce((acc, [price, quantity]) => {
                acc[price] = quantity;
                return acc;
            }, {} as Record<string, string>) || {};

        useEffect(() => {
            if (streamTicker?.data?.a) {
                if (streamTicker?.data?.u <= (depthSnapshot?.data?.lastUpdateId || 0)) return;

                if (!firstEventProcessed) {
                    if (streamTicker?.data?.U <= (depthSnapshot?.data?.lastUpdateId || 0) + 1) return;
                    if (streamTicker?.data?.u >= (depthSnapshot?.data?.lastUpdateId || 0) + 1) return;
                    firstEventProcessed = true;
                }

                console.log('fepwoih');

                // While listening to the stream, each new event's U should be equal to the previous event's u+1.
                if (streamTicker?.data?.U !== (previousStreamTicker?.data?.u || 0) + 1) return;
                setPreviousStreamTicker(streamTicker);

                for (let i = 0; i < streamTicker?.data?.a.length; i++) {
                    if (streamTicker?.data?.a[i][1] === '0.00000000')
                        delete hashOrderBookAsks[streamTicker?.data?.a[i][0]];
                    const [price, quantity] = streamTicker?.data?.a[i];
                    hashOrderBookAsks[price] = quantity;
                }
            }
        }, [streamTicker]);

        const maxAsksQuantity = useMemo(
            () => Object.entries(hashOrderBookAsks).reduce((acc, [, quantity]) => Math.max(acc, Number(quantity)), 0),
            [streamTicker?.data?.u],
        );

        // orderBookAsksTable update with streamTicker data
        const orderBookAsksTable = useMemo(
            () =>
                Object.entries(hashOrderBookAsks).map(([price, quantity], index) => {
                    const percentage = (Number(quantity) / maxAsksQuantity) * 100;
                    return (
                        <div
                            className="grid grid-cols-2 gap-1"
                            style={{background: `linear-gradient(90deg, rgb(255 0 0) ${percentage}%, #fff 0%)`}}
                            key={index}
                        >
                            <div>{price}</div>
                            <div>{quantity}</div>
                        </div>
                    );
                }),
            [streamTicker?.data?.u],
        );

        const maxBidsQuantity = useMemo(
            () =>
                Object.entries(hashOrderBookBids).reduce((acc, [, quantity]) => Math.max(acc, Number(quantity)), 0) ||
                0,
            [hashOrderBookBids],
        );

        const orderBookBidsTable = Object.entries(hashOrderBookBids).map(([price, quantity], index) => {
            const percentage = (Number(quantity) / maxBidsQuantity) * 100;
            return (
                <div
                    className="grid grid-cols-2 gap-1"
                    style={{background: `linear-gradient(90deg, rgb(22 163 74) ${percentage}%, #fff 0%)`}}
                    key={index}
                >
                    <div>{price}</div>
                    <div>{quantity}</div>
                </div>
            );
        });

        return (
            <div>
                <div className="grid grid-cols-2 gap-1 mt-4">
                    <div>ASKS</div>
                    <div>QUANTITY</div>
                </div>
                <div className="flex flex-col-reverse">{orderBookAsksTable}</div>
                <div className="grid grid-cols-2 gap-1 mt-10">
                    <div>BIDS</div>
                    <div>QUANTITY</div>
                </div>
                <div>{orderBookBidsTable}</div>
            </div>
        );
    },
});
