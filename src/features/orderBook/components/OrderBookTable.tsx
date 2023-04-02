import {memo, useMemo} from 'react';

import type {OrderBookTablePropsType} from '../types';

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const {groupedBids, groupedAsks, numOfOrderBookRows, streamAggTradePrice} = props;

    const maxAsksQuantity = useMemo(() => {
        let maxQuantity = 0;
        let index = 0;
        for (let i = 0; i < groupedAsks.length; i++) {
            if (index >= numOfOrderBookRows) break;
            const [_, quantity] = groupedAsks[i];
            maxQuantity = Math.max(maxQuantity, Number(quantity));
            index++;
        }
        return maxQuantity;
    }, [groupedAsks]);

    const orderBookAsksTable = useMemo(() => {
        const orderBookRows = [];
        let index = 0;
        for (let i = 0; i < groupedAsks.length; i++) {
            if (index >= numOfOrderBookRows) break;
            const [price, quantity] = groupedAsks[i];
            const percentage = (Number(quantity) / maxAsksQuantity) * 100;
            orderBookRows.push(
                <div
                    className="grid grid-cols-2 mb-0.5 text-slate-200 text-sm p-0.5"
                    style={{
                        background: `linear-gradient(90deg, rgba(198, 6, 6, 0.55) ${percentage}%, rgba(255, 255, 255, 0) 0%)`,
                    }}
                    key={price + quantity}
                >
                    <div>{price}</div>
                    <div>{Number(quantity).toPrecision(6)}</div>
                </div>,
            );
            index++;
        }

        return orderBookRows;
    }, [groupedAsks]);

    const maxBidsQuantity = useMemo(() => {
        let maxQuantity = 0;
        let index = 0;
        for (let i = 0; i < groupedBids.length; i++) {
            if (index >= numOfOrderBookRows) break;
            const [_, quantity] = groupedBids[i];
            maxQuantity = Math.max(maxQuantity, Number(quantity));
            index++;
        }
        return maxQuantity;
    }, [groupedBids]);

    const orderBookBidsTable = useMemo(() => {
        const orderBookRows = [];
        let index = 0;
        for (let i = 0; i < groupedBids.length; i++) {
            if (index >= numOfOrderBookRows) break;
            const [price, quantity] = groupedBids[i];
            const percentage = (Number(quantity) / maxBidsQuantity) * 100;
            orderBookRows.push(
                <div
                    className="grid grid-cols-2 mb-0.5 text-slate-200 text-sm p-0.5"
                    style={{
                        background: `linear-gradient(90deg, rgba(0, 185, 9, 0.55) ${percentage}%, rgba(255, 255, 255, 0) 0%)`,
                    }}
                    key={price + quantity}
                >
                    <div>{price}</div>
                    <div>{Number(quantity).toPrecision(6)}</div>
                </div>,
            );
            index++;
        }

        return orderBookRows;
    }, [groupedBids]);

    return (
        <div>
            <div className="flex flex-col-reverse">{orderBookAsksTable}</div>
            {/* <div className="my-4 text-xl">
                {parseFloat(streamAggTradePrice || '0')
                    .toString()
                    .replace(/\.?0+$/, '')}
            </div> */}
            <div className="my-1"></div>
            <div className="cols-reverse">{orderBookBidsTable}</div>
        </div>
    );
};

export default memo(OrderBookTable);
