import type { NormalizedTrade } from '@/services/exchanges/types';

import { decimalPlaces, formatCompactNumber, formatPrice } from '@/utils/number';

import type { DomQuantityMode } from '../domPreferences';

import { DomQuantityMode as QuantityMode } from '../domPreferences';
import styles from './DepthAndSales.module.css';

type Props = {
    minNotional: number;
    quantityMode: DomQuantityMode;
    rowCount: number;
    showHeader: boolean;
    showMeter: boolean;
    tickSize: number;
    trades: readonly NormalizedTrade[];
};

type TapeRowProps = {
    priceDecimals: number;
    quantityMode: DomQuantityMode;
    trade: NormalizedTrade;
};

const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
});

const displayQuantity = (value: number, price: number, quantityMode: DomQuantityMode): number =>
    quantityMode === QuantityMode.Notional ? value * price : value;

const tradeKey = (trade: NormalizedTrade): string => `${typeof trade.id}:${String(trade.id)}`;

const DepthAndSalesTapeRow = ({ priceDecimals, quantityMode, trade }: TapeRowProps) => {
    const isSell = trade.isBuyerMaker;
    return (
        <tr className={isSell ? styles.tapeSell : styles.tapeBuy} title={isSell ? 'Sell aggressor' : 'Buy aggressor'}>
            <td className={styles.tapeTime}>{TIME_FORMATTER.format(trade.time)}</td>
            <td className={styles.tapePrice}>{formatPrice(trade.price, priceDecimals)}</td>
            <td className={styles.tapeSize}>
                {formatCompactNumber(displayQuantity(trade.size, trade.price, quantityMode))}
            </td>
        </tr>
    );
};

const DepthAndSalesTape = ({ minNotional, quantityMode, rowCount, showHeader, showMeter, tickSize, trades }: Props) => {
    const priceDecimals = decimalPlaces(tickSize);
    const visibleTrades = trades.filter((trade) => trade.price * trade.size >= minNotional).slice(0, rowCount);

    return (
        <section aria-label="Time and sales" className={styles.tape}>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <caption className="sr-only">Newest live trades with aggressor side</caption>
                    <colgroup>
                        <col className={styles.colTapeTime} />
                        <col className={styles.colTapePrice} />
                        <col className={styles.colTapeSize} />
                    </colgroup>
                    {showHeader && (
                        <thead>
                            <tr>
                                <th scope="col">Time</th>
                                <th scope="col">Price</th>
                                <th scope="col">Size</th>
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {visibleTrades.map((trade) => (
                            <DepthAndSalesTapeRow
                                key={tradeKey(trade)}
                                priceDecimals={priceDecimals}
                                quantityMode={quantityMode}
                                trade={trade}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
            {showMeter && <div aria-hidden className={styles.tapeFooter} />}
        </section>
    );
};

export default DepthAndSalesTape;
