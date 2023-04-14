import {useState, memo, useMemo, forwardRef, useEffect} from 'react';
import formatDistanceStrict from 'date-fns/formatDistanceStrict';
import {Resizable, ResizableBox} from 'react-resizable';
import Draggable from 'react-draggable';

import {useDepthSnapshot, useStreamTicker, useStreamAggTrade} from '../api';

import type {TapePropsType} from '../types';

const calculateNumOfRows = (rowHeight: number, boxHeight: number) => {
    const numOfRowsCalculated = Math.floor(boxHeight / rowHeight);
    const numOfRows = (numOfRowsCalculated % 2 === 0 ? numOfRowsCalculated : numOfRowsCalculated - 1) / 2;
    return numOfRows;
};

const OrderBookTable = (props: TapePropsType) => {
    // const {streamAggTrade} = props;
    const streamAggTrade = useStreamAggTrade('BTCUSDT');

    const [height, setHeight] = useState(400);
    const [width, setWidth] = useState(250);
    const [tapeTable, setTapeTable] = useState<Element[]>([]);
    const [numOfRows, setNumOfRows] = useState(calculateNumOfRows(26, height));

    const calculateFormatDistanceStrict = (date: string) => {
        if (!date) return null;
        const now = new Date();
        const diff = formatDistanceStrict(new Date(date), now, {addSuffix: true});
        return diff;
    };

    const onOrderBookResize = (_, data: any) => {
        const {size} = data;
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

    useEffect(() => {
        if (!streamAggTrade || (Number(streamAggTrade?.data?.q) || 0) <= 0.1) return;
        // console.log(streamAggTrade?.data?.q);
        setTapeTable(
            (prev) =>
                [
                    <div
                        className="flex justify-between bg-red-600"
                        key={crypto.randomUUID()}
                        style={{
                            background: streamAggTrade?.data?.m ? 'rgba(0, 185, 9, 0.55)' : 'rgba(198, 6, 6, 0.55)',
                        }}
                    >
                        <div className="text-xs">{streamAggTrade?.data?.p.toString().replace(/\.?0+$/, '')}</div>
                        <div className="text-xs">{streamAggTrade?.data?.q.toString().replace(/\.?0+$/, '')}</div>
                        <div className="text-xs">{calculateFormatDistanceStrict(streamAggTrade?.data?.T as any)}</div>
                    </div>,
                    ...prev,
                ] as Element[],
        );
    }, [streamAggTrade?.data?.T]);

    return (
        <>
            <div>
                {numOfRows}
                <Draggable grid={[25, 25]} handle="strong">
                    <div className="fixed">
                        <strong className="cursor-move">TAPE</strong>
                        <ResizableBox
                            width={250}
                            height={height}
                            minConstraints={[250, height]}
                            draggableOpts={{grid: [25, 25]}}
                            handleSize={[10, 10]}
                            className="border border-1 relative overflow-auto"
                            onResize={onOrderBookResize}
                            handle={<CustomResizeHandle />}
                        >
                            <div>
                                <div className="flex justify-between">
                                    <div className="text-xs">PRICE</div>
                                    <div className="text-xs">SIZE</div>
                                    <div className="text-xs">Time</div>
                                </div>
                                <div>{tapeTable}</div>
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
