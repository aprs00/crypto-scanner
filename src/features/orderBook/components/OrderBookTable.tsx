import {useState, memo, useMemo, forwardRef} from 'react';
import {Resizable, ResizableBox} from 'react-resizable';
import Draggable from 'react-draggable';

import type {OrderBookTablePropsType} from '../types';

const calculateNumOfRows = (rowHeight: number, boxHeight: number) => {
    const numOfRowsCalculated = Math.floor(boxHeight / rowHeight);
    const numOfRows = (numOfRowsCalculated % 2 === 0 ? numOfRowsCalculated : numOfRowsCalculated - 1) / 2;
    return numOfRows;
};

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const {groupedBids, groupedAsks, numOfOrderBookRows, streamAggTradePrice} = props;

    const [height, setHeight] = useState(400);
    const [width, setWidth] = useState(250);
    const [numOfRows, setNumOfRows] = useState(calculateNumOfRows(26, height));

    const onOrderBookResize = (_, data: any) => {
        const {size} = data;
        // setHeight(size.height);
        const orderBookTableHeight = size.height;
        const rowHeight = 24;
        const numOfRows = calculateNumOfRows(rowHeight, orderBookTableHeight);
        setNumOfRows(numOfRows);
    };

    const CustomResizeHandle = forwardRef((props, ref) => {
        const {handleAxis, ...restProps} = props;
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

    const maxQuantity = useMemo(() => {
        let max = 0;
        let index = 0;
        const concattedAsksAndBids = [...groupedAsks, ...groupedBids];
        if (concattedAsksAndBids.length === 0) return 0;

        for (let i = 0; i <= concattedAsksAndBids.length; i++) {
            if (index >= numOfRows) break;
            const [_, quantity] = concattedAsksAndBids[i];
            max = Math.max(max, Number(quantity));
            index++;
        }
        return max;
    }, [groupedAsks, groupedBids]);

    const orderBookAsksTable = useMemo(() => {
        const orderBookRows = [];
        let index = 0;
        for (let i = 0; i < groupedAsks.length; i++) {
            if (index >= numOfRows) break;
            const [price, quantity] = groupedAsks[i];
            const percentage = (Number(quantity) / maxQuantity) * 100;
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

    const orderBookBidsTable = useMemo(() => {
        const orderBookRows = [];
        let index = 0;
        for (let i = 0; i < groupedBids.length; i++) {
            if (index >= numOfRows) break;
            const [price, quantity] = groupedBids[i];
            const percentage = (Number(quantity) / maxQuantity) * 100;
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
        <>
            <div>
                {numOfRows}
                <Draggable grid={[25, 25]} handle="strong">
                    <div className="fixed">
                        <strong className="cursor-move">ORDER BOOK</strong>
                        <ResizableBox
                            width={250}
                            height={height}
                            minConstraints={[250, height]}
                            draggableOpts={{grid: [25, 25]}}
                            handleSize={[10, 10]}
                            className="border border-1 relative"
                            onResize={onOrderBookResize}
                            handle={<CustomResizeHandle />}
                        >
                            <div>
                                <div className="flex flex-col-reverse">{orderBookAsksTable}</div>
                                <div className="my-1"></div>
                                <div className="cols-reverse">{orderBookBidsTable}</div>
                            </div>
                        </ResizableBox>
                    </div>
                </Draggable>
            </div>
        </>
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
