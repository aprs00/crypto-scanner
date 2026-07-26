import { useDocumentVisibility, useIntersection } from '@mantine/hooks';

import type { NormalizedTrade } from '@/services/exchanges/types';

import CSPanel from '@/components/Layouts/CSPanel';
import { useTrades } from '@/services/exchanges/hooks';
import { formatNumber, formatPrice } from '@/utils/number';

import { PanelType } from '../types';
import useResolvedSource from '../useResolvedSource';
import styles from './ChartTape.module.css';
import PanelSource from './PanelSource';

type Props = { panelId: string; onRemove: () => void };

const TAPE_LIMIT = 100;
const TAPE_PUBLISH_INTERVAL_MS = 200;

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
});

const ChartTapeRow = ({ trade }: Readonly<{ trade: NormalizedTrade }>) => (
    <div className={styles.row}>
        <span className="num dim">{TIME_FORMATTER.format(trade.time)}</span>
        <span className={`num ${trade.isBuyerMaker ? 'down' : 'up'}`}>{formatPrice(trade.price)}</span>
        <span className={`num ${styles.size}`}>{formatNumber(trade.size, { maximumFractionDigits: 8 })}</span>
    </div>
);

const ChartTape = ({ panelId, onRemove }: Props) => {
    const { exchange, symbol } = useResolvedSource(panelId, PanelType.Tape);
    const documentVisibility = useDocumentVisibility();
    const { entry, ref: intersectionRef } = useIntersection<HTMLDivElement>();
    const active = Boolean(entry?.isIntersecting) && documentVisibility === 'visible';
    const trades = useTrades(exchange, symbol, {
        active,
        limit: TAPE_LIMIT,
        publishIntervalMs: TAPE_PUBLISH_INTERVAL_MS,
    });

    return (
        <CSPanel
            className="h-full"
            controls={<PanelSource panelId={panelId} panelType={PanelType.Tape} />}
            onRemove={onRemove}
        >
            <div className={styles.head}>
                <span>TIME</span>
                <span>PRICE</span>
                <span className="text-right">SIZE</span>
            </div>
            <div className={`${styles.body} scroll`} ref={intersectionRef}>
                {trades.map((trade) => (
                    <ChartTapeRow key={`${typeof trade.id}:${String(trade.id)}`} trade={trade} />
                ))}
            </div>
        </CSPanel>
    );
};

export default ChartTape;
