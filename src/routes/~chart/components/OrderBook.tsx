import {useCallback, useMemo, useState} from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';
import NumberInput from '@/components/NumberInput';
import CustomSelect from '@/components/Select';
import Spinner from '@/components/Spinner';

import {useStreamTicker} from '../api';
import type {OrderBookTablePropsType} from '../types';
import {tableBackgroundStyle} from '../utils';

const tableAlignmentOptions = [
    {label: 'V', value: 'V'},
    {label: 'H', value: 'H'},
];

const quantityFormatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
});

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const {symbolTickSize, tableHeight} = props;

    const [numOfTicks, setNumOfTicks] = useState(100);
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

    const {groupedAsks, groupedBids} = useStreamTicker('BTCUSDT', groupByVal, calculatedNumOfRows) || {};

    const maxQuantity = useMemo(() => {
        const bidsAndAsks = groupedAsks?.concat(groupedBids) || [];
        return Math.max(...bidsAndAsks.map((limit: [number, number]) => limit[1]));
    }, [groupedAsks, groupedBids, calculatedNumOfRows]);

    const orderBookTable = useCallback(
        (groupedGetter: [number, number][], type: string) => {
            const rows = [];
            for (let i = 0; i < groupedGetter?.length; i++) {
                const [price, quantity] = groupedGetter?.[i] ?? [];
                const percentage = (Number(quantity) / maxQuantity) * 100;
                const formattedQuantity = quantityFormatter.format(Number(quantity));
                const tableAlignmentClass = tableAlignment === 'H' && type === 'bids' ? 'text-right' : '';

                rows.push(
                    <div
                        className={`grid grid-cols-2 mb-0.5 rounded text-slate-200 text-sm p-0.5 ${tableAlignmentClass}`}
                        key={price}
                        style={{background: tableBackgroundStyle(type, tableAlignment, percentage)}}
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
                            options={tableAlignmentOptions}
                            value={tableAlignment}
                            onChange={setTableAlignment}
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
