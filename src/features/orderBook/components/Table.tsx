import {useState, memo, useMemo, forwardRef, useCallback, useRef, useEffect} from 'react';

import type {OrderBookTablePropsType} from '../types';

const calculateNumOfRows = (rowHeight: number, boxHeight: number) => {
    const numOfRowsCalculated = Math.floor(boxHeight / rowHeight);
    console.log(boxHeight, rowHeight);
    const numOfRows =
        (numOfRowsCalculated % 2 === 0 ? numOfRowsCalculated : numOfRowsCalculated - 1) / 2 + numOfRowsCalculated / 4;
    // const numOfRows = Math.floor(numOfRowsCalculated / 2);
    console.log('numOfRowsCalculated', numOfRowsCalculated);
    console.log('numOfRows', numOfRows);
    return numOfRows;
};

const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
});

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const {groupedBids, groupedAsks, tableHeight} = props;

    const [height, setHeight] = useState(400);
    const [width, setWidth] = useState(250);
    // const [numOfRows, setNumOfRows] = useState(tableHeight);
    const [numOfRows, setNumOfRows] = useState(() => calculateNumOfRows(24, height));
    // const [numOfRows2, setNumOfRows2] = useState(() => calculateNumOfRows(26, tableHeight));
    // console.log('tableHeight: ', tableHeight);
    // console.log(numOfRows2);

    const tableRef = useRef<HTMLDivElement>(null);

    const calculatedNumOfRows = useMemo(() => {
        return calculateNumOfRows(30, tableHeight);
    }, [tableHeight]);

    // console.log(calculatedNumOfRows);

    const onOrderBookResize = (_: any, data: {size: {height: number}}) => {
        const {size} = data;
        const orderBookTableHeight = size.height;
        const rowHeight = 24;
        const numOfRows = calculateNumOfRows(rowHeight, orderBookTableHeight);
        setNumOfRows(numOfRows);
    };

    const CustomResizeHandle = forwardRef((props, ref) => {
        const {handleAxis, ...restProps} = props as any;
        return (
            <div className="bg-red-500 absolute bg-right-bottom" ref={ref} {...restProps}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" /> <path d="M16 8v8h-8" />{' '}
                </svg>
            </div>
        );
    });

    const memoizedGroupedAsks = useMemo(() => groupedAsks, [groupedAsks]);
    const memoizedGroupedBids = useMemo(() => groupedBids, [groupedBids]);

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
        <div ref={tableRef}>
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
