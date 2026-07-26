import type { CSSProperties } from 'react';

import { useDocumentVisibility, useIntersection, useResizeObserver } from '@mantine/hooks';
import { useState } from 'react';

import type { ExchangeId } from '@/services/exchanges/types';

import { SettingsIcon } from '@/components/Icons';
import CSPanel from '@/components/Layouts/CSPanel';
import CSButton from '@/components/UI/CSButton';
import CSSpinner from '@/components/UI/CSSpinner';
import { rowHeight } from '@/lib/theme';
import { useOrderBook } from '@/services/exchanges/hooks';
import { decimalPlaces, formatCompactUSD, formatNumber, formatPrice } from '@/utils/number';

import type { OrderBookViewRow } from '../orderBookView';
import type { Orientation } from '../types';

import { buildOrderBookView } from '../orderBookView';
import { Orientation as OrientationValue, PanelType } from '../types';
import useChartSeriesStore from '../useChartSeriesStore';
import useResolvedSource from '../useResolvedSource';
import styles from './OrderBook.module.css';
import OrderBookSettings from './OrderBookSettings';
import OrderBookVolumeIndicators from './OrderBookVolumeIndicators';
import PanelSource from './PanelSource';

const ORDERBOOK_ROW_HEIGHT = rowHeight.xs;
const ORDERBOOK_PUBLISH_INTERVAL_MS = 200;

type Props = { panelId: string; onRemove: () => void };

type OrderBookLiveBodyProps = Readonly<{
    base: string;
    exchange: ExchangeId;
    groupBy: number;
    notional: boolean;
    orientation: Orientation;
    symbol: string;
}>;

type OrderBookSideProps = Readonly<{
    isAsk: boolean;
    isHorizontal: boolean;
    notional: boolean;
    priceDecimals: number;
    rows: readonly OrderBookViewRow[];
}>;

type OrderBookRowProps = Readonly<{
    amount: number;
    cumulativeAmount: number;
    cumulativePercentage: number;
    isAsk: boolean;
    isHorizontalBid: boolean;
    notional: boolean;
    price: number;
    priceDecimals: number;
    sizePercentage: number;
}>;

type OrderBookRowStyle = CSSProperties & {
    '--cumulative-width': string;
    '--size-width': string;
};

const formatAmount = (amount: number, notional: boolean): string =>
    notional ? formatCompactUSD(amount) : formatNumber(amount, { maximumFractionDigits: 6 });

const OrderBookRow = ({
    amount,
    cumulativeAmount,
    cumulativePercentage,
    isAsk,
    isHorizontalBid,
    notional,
    price,
    priceDecimals,
    sizePercentage,
}: OrderBookRowProps) => {
    const rowStyle: OrderBookRowStyle = {
        '--cumulative-width': `${cumulativePercentage}%`,
        '--size-width': `${sizePercentage}%`,
    };

    return (
        <div
            className={[styles.row, isAsk ? styles.ask : styles.bid, isHorizontalBid && styles.fromRight]
                .filter(Boolean)
                .join(' ')}
            style={rowStyle}
        >
            <div className={[styles.price, isHorizontalBid && styles.priceRight].filter(Boolean).join(' ')}>
                {formatPrice(price, priceDecimals)}
            </div>
            <div className={styles.size}>{formatAmount(amount, notional)}</div>
            <div className={styles.total}>{formatAmount(cumulativeAmount, notional)}</div>
        </div>
    );
};

const OrderBookSide = ({ isAsk, isHorizontal, notional, priceDecimals, rows }: OrderBookSideProps) => {
    const isHorizontalBid = isHorizontal && !isAsk;
    const className = [isAsk ? styles.asks : styles.bids, isHorizontalBid && styles.horizontal]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={className}>
            {rows.map(({ amount, cumulativeAmount, cumulativePercentage, price, sizePercentage }) => (
                <OrderBookRow
                    amount={amount}
                    cumulativeAmount={cumulativeAmount}
                    cumulativePercentage={cumulativePercentage}
                    isAsk={isAsk}
                    isHorizontalBid={isHorizontalBid}
                    key={price}
                    notional={notional}
                    price={price}
                    priceDecimals={priceDecimals}
                    sizePercentage={sizePercentage}
                />
            ))}
        </div>
    );
};

const OrderBookLiveBody = ({ base, exchange, groupBy, notional, orientation, symbol }: OrderBookLiveBodyProps) => {
    const documentVisibility = useDocumentVisibility();
    const { entry, ref: intersectionRef } = useIntersection<HTMLDivElement>();
    const [rowsContainerRef, { height: rowsContainerHeight }] = useResizeObserver<HTMLDivElement>();
    const active = Boolean(entry?.isIntersecting) && documentVisibility === 'visible';
    const orderBook = useOrderBook(exchange, symbol, {
        active,
        publishIntervalMs: ORDERBOOK_PUBLISH_INTERVAL_MS,
    });
    const rowsThatFit = Math.max(0, Math.floor(rowsContainerHeight / ORDERBOOK_ROW_HEIGHT));
    const isHorizontal = orientation === OrientationValue.H;
    const bidRows = isHorizontal ? rowsThatFit : Math.floor(rowsThatFit / 2);
    const askRows = isHorizontal ? rowsThatFit : rowsThatFit - bidRows;
    const priceDecimals = decimalPlaces(groupBy);
    const { asks, bids, volume } = buildOrderBookView(orderBook, {
        askRows,
        bidRows,
        groupBy,
        notional,
    });

    return (
        <div className={styles.liveBody} ref={intersectionRef}>
            {!asks.length && <CSSpinner />}
            <OrderBookVolumeIndicators
                askAmount={volume.askAmount}
                askPercentage={volume.askPercentage}
                base={base}
                bidAmount={volume.bidAmount}
                bidPercentage={volume.bidPercentage}
                notional={notional}
            />
            <div
                className={[styles.container, isHorizontal && styles.horizontal].filter(Boolean).join(' ')}
                ref={rowsContainerRef}
            >
                <OrderBookSide
                    isAsk
                    isHorizontal={isHorizontal}
                    notional={notional}
                    priceDecimals={priceDecimals}
                    rows={asks}
                />
                <OrderBookSide
                    isAsk={false}
                    isHorizontal={isHorizontal}
                    notional={notional}
                    priceDecimals={priceDecimals}
                    rows={bids}
                />
            </div>
        </div>
    );
};

const OrderBook = ({ panelId, onRemove }: Props) => {
    const { base, exchange, symbol, tickSize } = useResolvedSource(panelId, PanelType.OrderBook);
    const notional = useChartSeriesStore((state) => state.orderBookNotional[panelId] ?? false);
    const setOrderBookNotional = useChartSeriesStore((state) => state.setOrderBookNotional);
    const [numOfTicks, setNumOfTicks] = useState(100);
    const [orientation, setOrientation] = useState<Orientation>(OrientationValue.V);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleNumOfTicks = (value: number) => {
        if (Number.isInteger(value)) setNumOfTicks(value);
    };
    const handleNotional = (showNotional: boolean) => setOrderBookNotional(panelId, showNotional);
    const handleOrientation = (value: Orientation) => setOrientation(value);
    const openSettings = () => setSettingsOpen(true);
    const closeSettings = () => setSettingsOpen(false);

    return (
        <>
            <CSPanel
                bodyClassName={styles.panelBody}
                className="h-full"
                controls={
                    <>
                        <PanelSource panelId={panelId} panelType={PanelType.OrderBook} />
                        <CSButton ariaLabel="Settings" onClick={openSettings} square title="Settings">
                            <SettingsIcon />
                        </CSButton>
                    </>
                }
                onRemove={onRemove}
            >
                <OrderBookLiveBody
                    base={base}
                    exchange={exchange}
                    groupBy={tickSize * numOfTicks}
                    notional={notional}
                    orientation={orientation}
                    symbol={symbol}
                />
            </CSPanel>
            <OrderBookSettings
                isOpen={settingsOpen}
                notional={notional}
                numOfTicks={numOfTicks}
                onClose={closeSettings}
                onNotionalChange={handleNotional}
                onNumOfTicksChange={handleNumOfTicks}
                onOrientationChange={handleOrientation}
                orientation={orientation}
            />
        </>
    );
};

export default OrderBook;
