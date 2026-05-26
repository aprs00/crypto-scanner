import { useLayoutEffect, useRef, useState } from 'react';

import CSPanel from '@/components/Layouts/CSPanel';
import IconButton from '@/components/UI/CSIconButton';
import CSSegmented from '@/components/UI/CSSegmented';
import CSSpinner from '@/components/UI/CSSpinner';
import NumberInput from '@/components/UI/NumberInput';
import { palette, withAlpha } from '@/lib/theme';
import { groupOrders } from '@/services/binance/OrderbookService';
import { useOrderBook } from '@/services/exchanges/hooks';
import { formatNumber, formatPrice } from '@/utils/number';

import { OrderbookType, Orientation, PanelType } from '../types';
import useResolvedSource from '../useResolvedSource';
import styles from './OrderBook.module.css';
import OrderBookVolumeIndicators from './OrderBookVolumeIndicators';
import PanelSource from './PanelSource';

const orientationOptions = Object.values(Orientation);

const linearGradingDegrees = {
    [OrderbookType.Asks]: {
        [Orientation.H]: '90deg',
        [Orientation.V]: '90deg',
    },
    [OrderbookType.Bids]: {
        [Orientation.H]: '270deg',
        [Orientation.V]: '90deg',
    },
};

// Per-row size bars: down/up at 30% alpha.
const linearGradingColors = {
    [OrderbookType.Asks]: withAlpha(palette.down, 0.3),
    [OrderbookType.Bids]: withAlpha(palette.up, 0.3),
};

const tableBackgroundStyle = (type: OrderbookType, orientation: Orientation, percentage: number) =>
    `linear-gradient(${linearGradingDegrees[type][orientation]}, ${
        linearGradingColors[type]
    } ${percentage}%, rgba(255, 255, 255, 0) 0%)`;

const ORDERBOOK_ROW_HEIGHT = 18;

type Props = { panelId: string; onRemove: () => void };

const OrderBookTable = ({ panelId, onRemove }: Props) => {
    const { exchange, symbol, tickSize: symbolTickSize } = useResolvedSource(panelId, PanelType.OrderBook);
    const orderBook = useOrderBook(exchange, symbol);

    const [numOfTicks, setNumOfTicks] = useState(100);
    const [orientation, setOrientation] = useState<Orientation>(Orientation.V);
    const [rowsThatFit, setRowsThatFit] = useState(0);
    const rowsContainerRef = useRef<HTMLDivElement>(null);

    const groupByVal = symbolTickSize * numOfTicks;

    const tickSizeDecimalPlaces = (() => {
        const tickSizeStr = symbolTickSize.toString();
        const decimalIndex = tickSizeStr.indexOf('.');
        return decimalIndex === -1 ? 0 : tickSizeStr.length - decimalIndex - 1;
    })();

    const calculatedBidRows = orientation === Orientation.V ? Math.floor(rowsThatFit / 2) : rowsThatFit;
    const calculatedAskRows = orientation === Orientation.V ? rowsThatFit - calculatedBidRows : rowsThatFit;

    const groupedOrderBook = groupOrders(orderBook, groupByVal, { asks: calculatedAskRows, bids: calculatedBidRows });

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
        const isOrientationHorizontal = orientation === Orientation.H && type === OrderbookType.Bids;
        const orientationClassRow = isOrientationHorizontal ? 'text-right' : '';

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

            const gradientDir = linearGradingDegrees[type][orientation];
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
                        className={[styles.row, isAsk ? styles.ask : styles.bid, orientationClassRow || undefined]
                            .filter(Boolean)
                            .join(' ')}
                        style={{ background: tableBackgroundStyle(type, orientation, percentage) }}
                    >
                        <div className={orientationClassRow}>{formattedPrice}</div>
                        <div>{formattedQuantity}</div>
                    </div>
                </div>,
            );

            cumulativeIndex++;
        }

        return rows;
    };

    const isHorizontal = orientation === Orientation.H;

    return (
        <>
            {!groupedOrderBook.asks.length && <CSSpinner />}

            <CSPanel
                bodyClassName={styles.panelBody}
                className="h-full"
                controls={
                    <>
                        <PanelSource panelId={panelId} panelType={PanelType.OrderBook} />
                        <NumberInput onChange={(e) => setNumOfTicks(e)} value={numOfTicks} />
                        <CSSegmented<Orientation>
                            onChange={setOrientation}
                            options={orientationOptions}
                            size="md"
                            value={orientation}
                        />
                        <IconButton label="-" onClick={onRemove} />
                    </>
                }
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
