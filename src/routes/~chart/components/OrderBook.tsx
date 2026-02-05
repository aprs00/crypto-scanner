import { useEffect, useRef, useState } from 'react';

import DraggableIcon from '@/assets/svg/draggable.svg?react';
import CSSelect from '@/components/UI/CSSelect';
import CSSpinner from '@/components/UI/CSSpinner';
import NumberInput from '@/components/UI/NumberInput';
import BinanceOrderBookService from '@/services/binance/OrderbookService';
import { formatNumber } from '@/utils/number';

import { OrderBookResponseType, OrderbookType, TableAlignment } from '../types';
import OrderBookVolumeIndicators from './OrderBookVolumeIndicators';

export type OrderBookTablePropsType = {
    tableHeight: number;
    symbol: string;
    symbolTickSize: number;
};

const tableAlignmentOptions = Object.values(TableAlignment);

const linearGradingDegrees = {
    [OrderbookType.Asks]: {
        [TableAlignment.H]: '90deg',
        [TableAlignment.V]: '90deg',
    },
    [OrderbookType.Bids]: {
        [TableAlignment.H]: '270deg',
        [TableAlignment.V]: '90deg',
    },
};

const linearGradingColors = {
    [OrderbookType.Asks]: 'rgba(198, 6, 6, 0.55)',
    [OrderbookType.Bids]: 'rgba(0, 185, 9, 0.55)',
};

const tableBackgroundStyle = (type: OrderbookType, tableAlignment: TableAlignment, percentage: number) =>
    `linear-gradient(${linearGradingDegrees[type][tableAlignment]}, ${
        linearGradingColors[type]
    } ${percentage}%, rgba(255, 255, 255, 0) 0%)`;

const ORDERBOOK_ROW_HEIGHT = 24;
const ORDERBOOK_HEADER_HEIGHT = 152;
const ORDERBOOK_BODY_MARGIN = 8;

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

    const availableBodyHeight = Math.max(0, tableHeight - ORDERBOOK_HEADER_HEIGHT - ORDERBOOK_BODY_MARGIN);
    const rowsThatFit = Math.max(0, Math.floor(availableBodyHeight / ORDERBOOK_ROW_HEIGHT));
    const calculatedBidRows =
        tableAlignment === TableAlignment.V ? Math.max(0, Math.floor(rowsThatFit / 2)) : rowsThatFit;
    const calculatedAskRows =
        tableAlignment === TableAlignment.V ? Math.max(0, rowsThatFit - calculatedBidRows) : rowsThatFit;

    const maxQuantity = (() => {
        const bidsAndAsks = groupedOrderBook.asks?.concat(groupedOrderBook.bids) || [];
        return Math.max(...bidsAndAsks.map((limit: [number, number]) => limit?.[1]));
    })();

    const orderBookTable = (groupedGetter: [number, number][], type: OrderbookType) => {
        const rows = [];
        const isTableAlignmentHorizontal = tableAlignment === TableAlignment.H && type === OrderbookType.Bids;
        const tableAlignmentClassContainer = isTableAlignmentHorizontal ? 'text-right' : '';
        const tableAlignmentClassRow = isTableAlignmentHorizontal ? 'order-1' : '';

        const cumulativeQuantities: number[] = [];
        let cumulative = 0;
        for (let i = 0; i < groupedGetter?.length; i++) {
            if (!groupedGetter[i]) continue;
            cumulative += groupedGetter[i][1];
            cumulativeQuantities.push(cumulative);
        }

        const maxCumulative = cumulativeQuantities[cumulativeQuantities.length - 1] || 0;

        const cumulativeColors = {
            [OrderbookType.Asks]: 'rgba(198, 6, 6, 0.15)',
            [OrderbookType.Bids]: 'rgba(0, 185, 9, 0.15)',
        };

        let cumulativeIndex = 0;
        for (let i = 0; i < groupedGetter?.length; i++) {
            if (!groupedGetter[i]) continue;
            const [price, quantity] = groupedGetter[i];
            const percentage = (quantity / maxQuantity) * 100;
            const cumulativePercentage = (cumulativeQuantities[cumulativeIndex] / maxCumulative) * 100;
            const formattedPrice = formatNumber(price, { maximumFractionDigits: tickSizeDecimalPlaces });
            const formattedQuantity = formatNumber(quantity, { maximumFractionDigits: 6 });

            const gradientDir = linearGradingDegrees[type][tableAlignment];
            const cumulativeBackground = `linear-gradient(${gradientDir}, ${cumulativeColors[type]} ${cumulativePercentage}%, rgba(255, 255, 255, 0) 0%)`;

            rows.push(
                <div className="h-6" key={price} style={{ background: cumulativeBackground }}>
                    <div
                        className={`grid grid-cols-2 text-slate-200 text-sm p-0.5 ${tableAlignmentClassContainer}`}
                        style={{ background: tableBackgroundStyle(type, tableAlignment, percentage) }}
                    >
                        <div className={tableAlignmentClassRow}>{formattedPrice}</div>
                        <div>{formattedQuantity}</div>
                    </div>
                </div>,
            );

            cumulativeIndex++;
        }

        return rows;
    };

    useEffect(() => {
        if (!symbolTickSize || !orderBook.asks || !binanceServiceRef.current) return;

        setGroupedOrderBook(
            binanceServiceRef.current.groupOrders(orderBook, groupByVal, {
                asks: calculatedAskRows,
                bids: calculatedBidRows,
            }),
        );
    }, [numOfTicks, calculatedAskRows, calculatedBidRows, orderBook, groupByVal, symbolTickSize]);

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
                <div className="bg-slate-800 pb-1">
                    <div className="flex items-center justify-between px-1">
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
                    <div className="pt-2">
                        <OrderBookVolumeIndicators groupedOrderBook={groupedOrderBook} orderBook={orderBook} />
                    </div>
                </div>
                <div className={orderbookContainerClasses}>
                    <div className="flex flex-1 flex-col-reverse">
                        {orderBookTable(groupedOrderBook.asks, OrderbookType.Asks)}
                    </div>
                    <div className={bidsContainerClasses}>
                        {orderBookTable(groupedOrderBook.bids, OrderbookType.Bids)}
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderBookTable;
