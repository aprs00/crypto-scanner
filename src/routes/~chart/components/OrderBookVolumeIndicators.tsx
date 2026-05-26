import { formatUSD } from '@/utils/number';

import { LocalOrderBook } from '../types';
import styles from './OrderBookVolumeIndicators.module.css';

export type OrderBookVolumeIndicatorsPropsType = {
    groupedOrderBook: {
        bids: [number, number][];
        asks: [number, number][];
    };
    orderBook: LocalOrderBook;
};

const OrderBookVolumeIndicators = ({ groupedOrderBook, orderBook }: OrderBookVolumeIndicatorsPropsType) => {
    const bestBidPrice = orderBook.bids.length > 0 ? orderBook.bids[0][0] : 0;
    const bestAskPrice = orderBook.asks.length > 0 ? orderBook.asks[0][0] : 0;
    const midPrice = (bestBidPrice + bestAskPrice) / 2;

    const totalAskVolume = orderBook.asks.reduce((sum, ask) => sum + (ask?.[1] ?? 0), 0);
    const totalBidVolume = orderBook.bids.reduce((sum, bid) => sum + (bid?.[1] ?? 0), 0);
    const totalVolume = totalBidVolume + totalAskVolume;

    const totalAskVolumeUSD = totalAskVolume * midPrice;
    const totalBidVolumeUSD = totalVolume > 0 ? (totalVolume - totalAskVolume) * midPrice : 0;

    const askPercentage = totalVolume > 0 ? (totalAskVolume / totalVolume) * 100 : 0;
    const bidPercentage = totalVolume > 0 ? 100 - askPercentage : 0;

    const visibleBidVolume = groupedOrderBook.bids.reduce((sum, bid) => sum + (bid?.[1] ?? 0), 0);
    const visibleAskVolume = groupedOrderBook.asks.reduce((sum, ask) => sum + (ask?.[1] ?? 0), 0);
    const visibleTotalVolume = visibleBidVolume + visibleAskVolume;

    const visibleBidVolumeUSD = visibleBidVolume * midPrice;
    const visibleAskVolumeUSD = visibleAskVolume * midPrice;

    const visibleBidPercentage = visibleTotalVolume > 0 ? (visibleBidVolume / visibleTotalVolume) * 100 : 0;
    const visibleAskPercentage = visibleTotalVolume > 0 ? (visibleAskVolume / visibleTotalVolume) * 100 : 0;

    const renderPercentageIndicator = (
        label: string,
        bidPct: number,
        askPct: number,
        bidVolumeUSD?: number,
        askVolumeUSD?: number,
    ) => (
        <div className={styles.row}>
            <span className={styles.label}>{label}</span>
            <div className={styles.meta}>
                <div className={styles.pcts}>
                    <span className={`${styles.side} ${styles.bid}`}>
                        {bidVolumeUSD !== undefined && <span className={styles.usd}>{formatUSD(bidVolumeUSD)}</span>}
                        <span className={styles.pct}>{bidPct.toFixed(1)}%</span>
                    </span>
                    <span className={`${styles.side} ${styles.ask}`}>
                        <span className={styles.pct}>{askPct.toFixed(1)}%</span>
                        {askVolumeUSD !== undefined && <span className={styles.usd}>{formatUSD(askVolumeUSD)}</span>}
                    </span>
                </div>
                <div className={styles.bar}>
                    <div className={`${styles.seg} ${styles.bid}`} style={{ width: `${bidPct}%` }} />
                    <div className={`${styles.seg} ${styles.ask}`} style={{ width: `${askPct}%` }} />
                    <span className={styles.tick} />
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.root}>
            {renderPercentageIndicator(
                'TOTAL MARKET',
                bidPercentage,
                askPercentage,
                totalBidVolumeUSD,
                totalAskVolumeUSD,
            )}
            {renderPercentageIndicator(
                'VISIBLE',
                visibleBidPercentage,
                visibleAskPercentage,
                visibleBidVolumeUSD,
                visibleAskVolumeUSD,
            )}
        </div>
    );
};

export default OrderBookVolumeIndicators;
