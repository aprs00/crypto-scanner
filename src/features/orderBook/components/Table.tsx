import {memo, useMemo, useCallback} from 'react';

import type {OrderBookTablePropsType} from '../types';

const calculateNumOfRows = (rowHeight: number, boxHeight: number) => {
    const numOfRowsCalculated = Math.floor(boxHeight / rowHeight);
    console.log(boxHeight, rowHeight);
    const numOfRows =
        (numOfRowsCalculated % 2 === 0 ? numOfRowsCalculated : numOfRowsCalculated - 1) / 2 + numOfRowsCalculated / 4;
    return numOfRows;
};

const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
});

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const {groupedBids, groupedAsks, tableHeight} = props;

    const memoizedGroupedAsks = useMemo(() => groupedAsks, [groupedAsks]);
    const memoizedGroupedBids = useMemo(() => groupedBids, [groupedBids]);

    const calculatedNumOfRows = useMemo(() => {
        return calculateNumOfRows(30, tableHeight);
    }, [tableHeight]);

    const maxQuantity = useCallback(() => {
        let max = 0;
        let index = 0;
        const concattedAsksAndBids = [...groupedAsks, ...groupedBids];
        if (concattedAsksAndBids.length === 0) return 0;

        for (let i = 0; i < concattedAsksAndBids.length && index < calculatedNumOfRows; i++) {
            if (index >= calculatedNumOfRows) break;
            const [_, quantity] = concattedAsksAndBids[i];
            max = Math.max(max, Number(quantity));
            index++;
        }

        return max;
    }, [memoizedGroupedAsks, memoizedGroupedBids, calculatedNumOfRows]);

    const orderBookAsksTable = useCallback(() => {
        const orderBookRows = [];
        let index = 0;
        for (let i = 0; i < groupedAsks.length; i++) {
            if (index >= calculatedNumOfRows) break;
            const [price, quantity] = groupedAsks[i];
            const percentage = (Number(quantity) / maxQuantity()) * 100;
            const formattedQuantity = formatter.format(Number(quantity));
            orderBookRows.push(
                <div
                    className="grid grid-cols-2 mb-0.5 text-slate-200 text-sm p-0.5"
                    style={{
                        background: `linear-gradient(90deg, rgba(198, 6, 6, 0.55) ${percentage}%, rgba(255, 255, 255, 0) 0%)`,
                    }}
                    key={price + quantity}
                >
                    <div>{price}</div>
                    <div>{formattedQuantity}</div>
                </div>,
            );
            index++;
        }

        return orderBookRows;
    }, [memoizedGroupedAsks, maxQuantity, calculatedNumOfRows]);

    const orderBookBidsTable = useCallback(() => {
        const orderBookRows = [];
        let index = 0;
        for (let i = 0; i < groupedBids.length; i++) {
            if (index >= calculatedNumOfRows) break;
            const [price, quantity] = groupedBids[i];
            const percentage = (Number(quantity) / maxQuantity()) * 100;
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
    }, [memoizedGroupedBids, maxQuantity, calculatedNumOfRows]);

    return (
        <div>
            <div className="flex flex-col-reverse">{orderBookAsksTable()}</div>
            <div className="my-1"></div>
            <div className="cols-reverse">{orderBookBidsTable()}</div>
        </div>
    );
};

export default memo(OrderBookTable);

{
    /* <div className="my-4 text-xl">
{parseFloat(streamAggTradePrice || '0')
.toString()
.replace(/\.?0+$/, '')}
</div> */
}
