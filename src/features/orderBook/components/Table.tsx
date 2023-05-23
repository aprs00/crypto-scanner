import {memo, useMemo, useCallback} from 'react';

import Spinner from '@/components/Spinner';
import CustomSelect from '@/components/Select';
import {useStreamTicker} from '../api';
import type {OrderBookTablePropsType} from '../types';

const calculateNumOfRows = (rowHeight: number, boxHeight: number, divideBy: number) => {
    const numOfRowsCalculated = Math.floor(boxHeight / rowHeight);
    const numOfRows =
        (numOfRowsCalculated % 2 === 0 ? numOfRowsCalculated : numOfRowsCalculated - 1) / 2 +
        numOfRowsCalculated / divideBy;
    return numOfRows;
};

const quantityFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
});

const backgroundStyleVal = (type: string, tableAlignment: string, percentage: number) => {
    const linearGradingDegVal = {
        asks: {
            V: '90deg',
            H: '90deg',
            color: 'rgba(198, 6, 6, 0.55)',
        },
        bids: {
            V: '90deg',
            H: '270deg',
            color: 'rgba(0, 185, 9, 0.55)',
        },
    };
    return `linear-gradient(${linearGradingDegVal[type as 'asks' | 'bids'][tableAlignment as 'V' | 'H']}, ${
        linearGradingDegVal[type as 'asks' | 'bids'].color
    } ${percentage}%, rgba(255, 255, 255, 0) 0%)`;
};

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const {tableHeight, setGroupByVal, groupByVal, tableAlignment, setTableAlignment} = props;

    const calculatedNumOfRows = useMemo(() => {
        const divideBy = tableAlignment === 'V' ? 4 : 1;
        return calculateNumOfRows(30, tableHeight, divideBy);
    }, [tableHeight, tableAlignment]);

    const streamTicker = useStreamTicker('BTCUSDT', groupByVal, calculatedNumOfRows);
    const groupedBids = streamTicker?.data?.groupedBids;
    const groupedAsks = streamTicker?.data?.groupedAsks;
    const firstEventProcessed = streamTicker?.data?.firstEventProcessed;

    const linearGradingDeg = useCallback(
        (type: string) => {
            return tableAlignment === 'V' ? '90deg' : type === 'bids' ? '270deg' : '';
        },
        [tableAlignment],
    );

    const maxQuantity = useMemo(() => {
        if (!groupedAsks || !groupedAsks) return 0;
        let max = 0;
        let index = 0;
        const bidsAndAsks = groupedAsks.concat(groupedBids);

        for (let i = 0; i < bidsAndAsks.length && index < calculatedNumOfRows; i++) {
            if (index >= calculatedNumOfRows) break;
            const [_, quantity] = bidsAndAsks[i];
            max = Math.max(max, Number(quantity));
            index++;
        }

        return max;
    }, [groupedAsks, groupedBids, calculatedNumOfRows]);

    const orderBookTable = useCallback(
        (groupedGetter: [string, string][], type: string) => {
            const orderBookRows = [];
            let index = 0;
            for (let i = 0; i < groupedGetter?.length; i++) {
                if (index >= calculatedNumOfRows) break;
                const [price, quantity] = groupedGetter?.[i];
                const percentage = (Number(quantity) / maxQuantity) * 100;
                const formattedQuantity = quantityFormatter.format(Number(quantity));
                orderBookRows.push(
                    <div
                        className={`grid grid-cols-2 mb-0.5 text-slate-200 text-sm p-0.5 ${
                            tableAlignment === 'H' && type === 'bids' ? 'text-right' : ''
                        }`}
                        style={{
                            background: backgroundStyleVal(type, tableAlignment, percentage),
                        }}
                        key={price + quantity}
                    >
                        <div className={`${tableAlignment === 'H' && type === 'bids' ? 'order-1' : ''}`}>{price}</div>
                        <div>{formattedQuantity}</div>
                    </div>,
                );
                index++;
            }

            return orderBookRows;
        },
        [groupedBids, groupedAsks, maxQuantity, calculatedNumOfRows],
    );

    return (
        <>
            {!firstEventProcessed && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Spinner />
                </div>
            )}
            <div>
                <div className="flex border-solid border-b border-slate-700 mb-1">
                    <CustomSelect
                        options={[
                            {label: 'V', value: 'V'},
                            {label: 'H', value: 'H'},
                        ]}
                        value={tableAlignment}
                        onChange={(e) => {
                            setTableAlignment(e as string);
                        }}
                    />
                </div>
                <div className={`m-1 ${tableAlignment === 'H' ? 'flex flex-row-reverse' : ''}`}>
                    <div className="flex flex-1 flex-col-reverse">{orderBookTable(groupedAsks, 'asks')}</div>
                    <div className="my-1"></div>
                    <div className={`${tableAlignment === 'H' ? 'flex flex-col-reverse flex-1' : ''}`}>
                        {orderBookTable(groupedBids, 'bids')}
                    </div>
                </div>
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
