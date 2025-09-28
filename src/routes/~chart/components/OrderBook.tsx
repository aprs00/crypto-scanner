import { useEffect, useRef, useState } from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';
import CSSelect from '@/components/UI/CSSelect';
import CSSpinner from '@/components/UI/CSSpinner';
import NumberInput from '@/components/UI/NumberInput';
import BinanceOrderBookService from '@/services/binance/OrderbookService';
import { formatNumber } from '@/utils/number';

import { OrderBookResponseType, OrderbookType, TableAlignment } from '../types';
import { tableBackgroundStyle } from '../utils';

export type OrderBookTablePropsType = {
    tableHeight: number;
    symbol: string;
    symbolTickSize: number;
};

const tableAlignmentOptions: TableAlignment[] = [TableAlignment.V, TableAlignment.H];

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const { symbolTickSize, tableHeight } = props;

    const [orderBook, setOrderBook] = useState<OrderBookResponseType>({ bids: [], asks: [], lastUpdateId: 0 });
    const [groupedOrderBook, setGroupedOrderBook] = useState<{
        bids: [number, number][];
        asks: [number, number][];
    }>({ bids: [], asks: [] });
    const [numOfTicks, setNumOfTicks] = useState(100);
    const [tableAlignment, setTableAlignment] = useState<TableAlignment>(TableAlignment.V);
    const binanceServiceRef = useRef<BinanceOrderBookService | null>(null);

    const groupByVal = symbolTickSize * numOfTicks;

    const tickSizeDecimalPlaces = (() => {
        const tickSizeStr = symbolTickSize.toString();
        const decimalIndex = tickSizeStr.indexOf('.');
        return decimalIndex === -1 ? 0 : tickSizeStr.length - decimalIndex - 1;
    })();

    const calculatedNumOfRows = (() => {
        const divideBy = tableAlignment === TableAlignment.V ? 4 : 1;
        const calc = Math.floor(tableHeight / 30);
        const numOfRows = (calc % 2 === 0 ? calc : calc - 1) / 2 + calc / divideBy;
        return Math.floor(numOfRows);
    })();

    const maxQuantity = (() => {
        const bidsAndAsks = groupedOrderBook.asks?.concat(groupedOrderBook.bids) || [];
        return Math.max(...bidsAndAsks.map((limit: [number, number]) => limit?.[1]));
    })();

    const orderBookTable = (groupedGetter: [number, number][], type: OrderbookType) => {
        const rows = [];
        const isTableAlignmentHorizontal = tableAlignment === TableAlignment.H && type === OrderbookType.Bids;
        const tableAlignmentClassContainer = isTableAlignmentHorizontal ? 'text-right' : '';
        const tableAlignmentClassRow = isTableAlignmentHorizontal ? 'order-1' : '';

        for (let i = 0; i < groupedGetter?.length; i++) {
            if (!groupedGetter[i]) continue;
            const [price, quantity] = groupedGetter[i];
            const percentage = (quantity / maxQuantity) * 100;
            const formattedPrice = formatNumber(price, { maximumFractionDigits: tickSizeDecimalPlaces });
            const formattedQuantity = formatNumber(quantity, { maximumFractionDigits: 6 });

            rows.push(
                <div
                    className={`grid grid-cols-2 mb-0.5 text-slate-200 text-sm p-0.5 ${tableAlignmentClassContainer}`}
                    key={price}
                    style={{ background: tableBackgroundStyle(type, tableAlignment, percentage) }}
                >
                    <div className={tableAlignmentClassRow}>{formattedPrice}</div>
                    <div>{formattedQuantity}</div>
                </div>,
            );
        }

        return rows;
    };

    useEffect(() => {
        if (!symbolTickSize || !orderBook.asks || !binanceServiceRef.current) return;

        setGroupedOrderBook(binanceServiceRef.current.groupOrders(orderBook, groupByVal, calculatedNumOfRows));
    }, [numOfTicks, calculatedNumOfRows, orderBook, groupByVal, symbolTickSize]);

    useEffect(() => {
        binanceServiceRef.current = new BinanceOrderBookService('btcusdt', setOrderBook);
        binanceServiceRef.current.initialize();

        return () => {
            if (binanceServiceRef.current) {
                binanceServiceRef.current.close();
            }
        };
    }, []);

    const orderbookContainerClasses = `m-1 ${tableAlignment === TableAlignment.H ? 'flex flex-row-reverse' : ''}`;
    const bidsContainerClasses = tableAlignment === TableAlignment.H ? 'flex flex-col-reverse flex-1' : '';

    return (
        <>
            {!groupedOrderBook.asks.length && <CSSpinner />}

            <div className="border-4 border-slate-800 rounded-sm h-full z-50">
                <div className="flex items-center bg-slate-800 pb-1 justify-between">
                    <DraggableIcon id="drag-handle" />
                    <div className="flex items-center gap-2">
                        <CSSelect<TableAlignment>
                            onChange={setTableAlignment}
                            options={tableAlignmentOptions}
                            value={tableAlignment}
                        />
                        <NumberInput onChange={(e) => setNumOfTicks(e)} value={numOfTicks} />
                    </div>
                </div>
                <div className={orderbookContainerClasses}>
                    <div className="flex flex-1 flex-col-reverse">
                        {orderBookTable(groupedOrderBook.asks, OrderbookType.Asks)}
                    </div>
                    <div className="my-1" />
                    <div className={bidsContainerClasses}>
                        {orderBookTable(groupedOrderBook.bids, OrderbookType.Bids)}
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderBookTable;
