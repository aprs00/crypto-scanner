import { formatCompactUSD, formatNumber } from '@/utils/number';

import styles from './OrderBookVolumeIndicators.module.css';

type OrderBookVolumeIndicatorsPropsType = {
    askAmount: number;
    askPercentage: number;
    base: string;
    bidAmount: number;
    bidPercentage: number;
    notional: boolean;
};

const formatAmount = (amount: number, base: string, notional: boolean): string =>
    notional
        ? formatCompactUSD(amount)
        : `${formatNumber(amount, {
              maximumFractionDigits: 6,
              notation: Math.abs(amount) >= 1_000_000 ? 'compact' : 'standard',
          })}${base ? ` ${base}` : ''}`;

const OrderBookVolumeIndicators = ({
    askAmount,
    askPercentage,
    base,
    bidAmount,
    bidPercentage,
    notional,
}: OrderBookVolumeIndicatorsPropsType) => {
    return (
        <div className={styles.root}>
            <div className={styles.row}>
                <span className={styles.label}>Loaded Depth</span>
                <div className={styles.meta}>
                    <div className={styles.pcts}>
                        <span className={`${styles.side} ${styles.bid}`}>
                            <span className={styles.amount}>{formatAmount(bidAmount, base, notional)}</span>
                            <span className={styles.pct}>{bidPercentage.toFixed(1)}%</span>
                        </span>
                        <span className={`${styles.side} ${styles.ask}`}>
                            <span className={styles.pct}>{askPercentage.toFixed(1)}%</span>
                            <span className={styles.amount}>{formatAmount(askAmount, base, notional)}</span>
                        </span>
                    </div>
                    <div className={styles.bar}>
                        <div className={`${styles.seg} ${styles.bid}`} style={{ width: `${bidPercentage}%` }} />
                        <div className={`${styles.seg} ${styles.ask}`} style={{ width: `${askPercentage}%` }} />
                        <span className={styles.tick} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderBookVolumeIndicators;
