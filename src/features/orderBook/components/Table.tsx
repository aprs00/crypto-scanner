import {useMemo, useCallback, useState} from 'react';

import NumberInput from '@/components/NumberInput';
import Spinner from '@/components/Spinner';
import CustomSelect from '@/components/Select';
import DraggableIcon from '@/assets/svg/draggable.svg?react';

import {useStreamTicker} from '../api';
import {tableBackgroundStyle} from '../utils';
import type {OrderBookTablePropsType} from '../types';

const quantityFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
});

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const {tableHeight, symbolTickSize, tickSize} = props;

    const [numOfTicks, setNumOfTicks] = useState(tickSize);
    const [tableAlignment, setTableAlignment] = useState('V');

    const groupByVal = useMemo(() => symbolTickSize * numOfTicks, [symbolTickSize, numOfTicks]);

    const tickSizeDecimalPlaces = useMemo(() => {
        const tickSizeStr = symbolTickSize.toString();
        const decimalIndex = tickSizeStr.indexOf('.');
        return decimalIndex === -1 ? 0 : tickSizeStr.length - decimalIndex - 1;
    }, [symbolTickSize]);

    const calculatedNumOfRows = useMemo(() => {
        const divideBy = tableAlignment === 'V' ? 4 : 1;
        const calc = Math.floor(tableHeight / 30);
        const numOfRows = (calc % 2 === 0 ? calc : calc - 1) / 2 + calc / divideBy;
        return Math.floor(numOfRows);
    }, [tableHeight, tableAlignment]);

    const {groupedBids, groupedAsks} = useStreamTicker('BTCUSDT', groupByVal, calculatedNumOfRows) || {};

    const maxQuantity = useMemo(() => {
        const bidsAndAsks = groupedAsks?.concat(groupedBids) || [];
        return Math.max(...bidsAndAsks.map(([_, quantity, __]: [number, number, string]) => quantity));
    }, [groupedAsks, groupedBids, calculatedNumOfRows]);

    const orderBookTable = useCallback(
        (groupedGetter: [number, number, string][], type: string) => {
            const rows = [];
            for (let i = 0; i < groupedGetter?.length; i++) {
                const [price, quantity, id] = groupedGetter?.[i];
                const percentage = (Number(quantity) / maxQuantity) * 100;
                const formattedQuantity = quantityFormatter.format(Number(quantity));
                rows.push(
                    <div
                        className={`grid grid-cols-2 mb-0.5 rounded text-slate-200 text-sm p-0.5 ${
                            tableAlignment === 'H' && type === 'bids' ? 'text-right' : ''
                        }`}
                        style={{background: tableBackgroundStyle(type, tableAlignment, percentage)}}
                        key={id}
                    >
                        <div className={`${tableAlignment === 'H' && type === 'bids' ? 'order-1' : ''}`}>
                            {price.toFixed(tickSizeDecimalPlaces)}
                        </div>
                        <div>{formattedQuantity}</div>
                    </div>,
                );
            }

            return rows;
        },
        [groupedBids, groupedAsks, maxQuantity, calculatedNumOfRows],
    );

    return (
        <>
            {!groupedAsks && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Spinner />
                </div>
            )}
            <div className="border-4 border-slate-800 rounded h-full z-50">
                <div className="flex items-center bg-slate-800 pb-1 justify-between">
                    <DraggableIcon id="drag-handle" />
                    <div className="flex items-center gap-2">
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
                        <NumberInput value={numOfTicks} onChange={(e) => setNumOfTicks(e)} />
                    </div>
                </div>
                <div className={`m-1 ${tableAlignment === 'H' ? 'flex flex-row-reverse' : ''}`}>
                    <div className="flex flex-1 flex-col-reverse">{orderBookTable(groupedAsks, 'asks')}</div>
                    <div className="my-1" />
                    <div className={`${tableAlignment === 'H' ? 'flex flex-col-reverse flex-1' : ''}`}>
                        {orderBookTable(groupedBids, 'bids')}
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderBookTable;
