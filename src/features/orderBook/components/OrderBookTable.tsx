import {memo} from 'react';

import type {OrderBookTablePropsType} from '../types';

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const {hashOrderBookAsks, hashOrderBookBids, groupByNum, numOfOrderBookRows, streamAggTradePrice} = props;

    const groupedOrderBookAsks = Object.entries(hashOrderBookAsks).reduce(
        (acc: Record<string, string>, [priceStr, value]) => {
            const price = Math.ceil(parseFloat(priceStr) / groupByNum) * groupByNum;
            acc[price] = (Number(acc[price] || 0) + Number(value)).toString();
            return acc;
        },
        {},
    );

    const maxAsksQuantity = () =>
        Object.entries(groupedOrderBookAsks)
            .slice(0, numOfOrderBookRows)
            .reduce((acc, [, quantity]) => Math.max(acc, Number(quantity)), 0) || 0;

    const orderBookAsksTable = () =>
        Object.entries(groupedOrderBookAsks)
            .slice(0, numOfOrderBookRows)
            .map(([price, quantity], index) => {
                const percentage = (Number(quantity) / maxAsksQuantity()) * 100;
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
            });

    const groupedOrderBookBids = Object.entries(hashOrderBookBids).reduce(
        (acc: Record<string, string>, [priceStr, value]) => {
            const price = Math.floor(parseFloat(priceStr) / groupByNum) * groupByNum;
            acc[price] = (Number(acc[price] || 0) + Number(value) || 0).toString();
            return acc;
        },
        {},
    );

    const maxBidsQuantity = () =>
        Object.entries(groupedOrderBookBids)
            .slice(-numOfOrderBookRows)
            .reverse()
            .reduce((acc, [, quantity]) => Math.max(acc, Number(quantity)), 0) || 0;

    const orderBookBidsTable = () =>
        Object.entries(groupedOrderBookBids)
            .slice(-numOfOrderBookRows)
            .reverse()
            .map(([price, quantity], index) => {
                const percentage = (Number(quantity) / maxBidsQuantity()) * 100;
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
            });

    return (
        <div>
            <div className="flex flex-col-reverse">{orderBookAsksTable()}</div>
            <div className="my-4 text-xl">
                {parseFloat(streamAggTradePrice || '0')
                    .toString()
                    .replace(/\.?0+$/, '')}
            </div>
            <div>{orderBookBidsTable()}</div>
        </div>
    );
};

export default memo(OrderBookTable);
