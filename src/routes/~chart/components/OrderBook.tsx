import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import CSPanel from '@/components/Layouts/CSPanel';
import CSSelect from '@/components/UI/CSSelect';
import CSSpinner from '@/components/UI/CSSpinner';
import NumberInput from '@/components/UI/NumberInput';
import { palette, withAlpha } from '@/lib/theme';
import BinanceOrderBookService from '@/services/binance/OrderbookService';
import { formatNumber, formatPrice } from '@/utils/number';

import { OrderBookResponseType, OrderbookType, TableAlignment } from '../types';
import styles from './OrderBook.module.css';
import OrderBookVolumeIndicators from './OrderBookVolumeIndicators';

export type OrderBookTablePropsType = {
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

// Per-row size bars: down/up at 30% alpha.
const linearGradingColors = {
    [OrderbookType.Asks]: withAlpha(palette.down, 0.3),
    [OrderbookType.Bids]: withAlpha(palette.up, 0.3),
};

const tableBackgroundStyle = (type: OrderbookType, tableAlignment: TableAlignment, percentage: number) =>
    `linear-gradient(${linearGradingDegrees[type][tableAlignment]}, ${
        linearGradingColors[type]
    } ${percentage}%, rgba(255, 255, 255, 0) 0%)`;

const ORDERBOOK_ROW_HEIGHT = 18;

const OrderBookTable = (props: OrderBookTablePropsType) => {
    const { symbolTickSize } = props;

    const [orderBook, setOrderBook] = useState<OrderBookResponseType>({ bids: [], asks: [], lastUpdateId: 0 });
    const [groupedOrderBook, setGroupedOrderBook] = useState<{
        bids: [number, number][];
        asks: [number, number][];
    }>({ bids: [], asks: [] });
    const [numOfTicks, setNumOfTicks] = useState(100);
    const [tableAlignment, setTableAlignment] = useState<TableAlignment>(TableAlignment.V);
    const [rowsThatFit, setRowsThatFit] = useState(0);
    const binanceServiceRef = useRef<BinanceOrderBookService | null>(null);
    const rowsContainerRef = useRef<HTMLDivElement>(null);

    const groupByVal = symbolTickSize * numOfTicks;

    const tickSizeDecimalPlaces = (() => {
        const tickSizeStr = symbolTickSize.toString();
        const decimalIndex = tickSizeStr.indexOf('.');
        return decimalIndex === -1 ? 0 : tickSizeStr.length - decimalIndex - 1;
    })();

    const calculatedBidRows = tableAlignment === TableAlignment.V ? Math.floor(rowsThatFit / 2) : rowsThatFit;
    const calculatedAskRows = tableAlignment === TableAlignment.V ? rowsThatFit - calculatedBidRows : rowsThatFit;

    useLayoutEffect(() => {
        const el = rowsContainerRef.current;
        if (!el) return;
        const measure = () => setRowsThatFit(Math.max(0, Math.floor(el.clientHeight / ORDERBOOK_ROW_HEIGHT)));
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const maxQuantity = (() => {
        const bidsAndAsks = groupedOrderBook.asks?.concat(groupedOrderBook.bids) || [];
        return Math.max(...bidsAndAsks.map((limit: [number, number]) => limit?.[1]));
    })();

    const orderBookTable = (groupedGetter: [number, number][], type: OrderbookType) => {
        const rows = [];
        const isTableAlignmentHorizontal = tableAlignment === TableAlignment.H && type === OrderbookType.Bids;
        const tableAlignmentClassRow = isTableAlignmentHorizontal ? 'text-right' : '';

        const cumulativeQuantities: number[] = [];
        let cumulative = 0;
        for (let i = 0; i < groupedGetter?.length; i++) {
            if (!groupedGetter[i]) continue;
            cumulative += groupedGetter[i][1];
            cumulativeQuantities.push(cumulative);
        }

        const maxCumulative = cumulativeQuantities[cumulativeQuantities.length - 1] || 0;

        const cumulativeColors = {
            [OrderbookType.Asks]: withAlpha(palette.down, 0.1),
            [OrderbookType.Bids]: withAlpha(palette.up, 0.1),
        };

        const isAsk = type === OrderbookType.Asks;

        let cumulativeIndex = 0;
        for (let i = 0; i < groupedGetter?.length; i++) {
            if (!groupedGetter[i]) continue;
            const [price, quantity] = groupedGetter[i];
            const percentage = (quantity / maxQuantity) * 100;
            const cumulativePercentage = (cumulativeQuantities[cumulativeIndex] / maxCumulative) * 100;
            const formattedPrice = formatPrice(price, tickSizeDecimalPlaces);
            const formattedQuantity = formatNumber(quantity, { maximumFractionDigits: 6 });

            const gradientDir = linearGradingDegrees[type][tableAlignment];
            const cumulativeBackground = `linear-gradient(${gradientDir}, ${cumulativeColors[type]} ${cumulativePercentage}%, rgba(255, 255, 255, 0) 0%)`;

            rows.push(
                <div
                    key={price}
                    style={{
                        height: ORDERBOOK_ROW_HEIGHT,
                        background: cumulativeBackground,
                    }}
                >
                    <div
                        className={[styles.row, isAsk ? styles.ask : styles.bid, tableAlignmentClassRow || undefined]
                            .filter(Boolean)
                            .join(' ')}
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

    const isHorizontal = tableAlignment === TableAlignment.H;

    return (
        <>
            {!groupedOrderBook.asks.length && <CSSpinner />}

            <CSPanel
                bodyClassName={styles.panelBody}
                className="h-full"
                controls={
                    <>
                        <CSSelect<TableAlignment>
                            onChange={setTableAlignment}
                            options={tableAlignmentOptions}
                            value={tableAlignment}
                        />
                        <NumberInput onChange={(e) => setNumOfTicks(e)} value={numOfTicks} />
                    </>
                }
                title="Order Book"
            >
                <OrderBookVolumeIndicators groupedOrderBook={groupedOrderBook} orderBook={orderBook} />
                <div
                    className={[styles.container, isHorizontal && styles.horizontal].filter(Boolean).join(' ')}
                    ref={rowsContainerRef}
                >
                    <div className={styles.asks}>{orderBookTable(groupedOrderBook.asks, OrderbookType.Asks)}</div>
                    <div className={[styles.bids, isHorizontal && styles.horizontal].filter(Boolean).join(' ')}>
                        {orderBookTable(groupedOrderBook.bids, OrderbookType.Bids)}
                    </div>
                </div>
            </CSPanel>
        </>
    );
};

export default OrderBookTable;
