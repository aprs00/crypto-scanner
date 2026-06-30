import CSPanel from '@/components/Layouts/CSPanel';
import CSButton from '@/components/UI/CSButton';
import { useTrades } from '@/services/exchanges/hooks';
import { formatNumber, formatPrice } from '@/utils/number';

import { PanelType } from '../types';
import useResolvedSource from '../useResolvedSource';
import styles from './ChartTape.module.css';
import PanelSource from './PanelSource';

type Props = { panelId: string; onRemove: () => void };

const ChartTape = ({ panelId, onRemove }: Props) => {
    const { exchange, symbol } = useResolvedSource(panelId, PanelType.Tape);
    const trades = useTrades(exchange, symbol);

    const tapeTable = trades.map((trade) => (
        <div className={styles.row} key={trade.id}>
            <span className="num dim">{new Date(trade.time).toLocaleTimeString()}</span>
            <span className={`num ${trade.isBuyerMaker ? 'up' : 'down'}`}>{formatPrice(trade.price)}</span>
            <span className={`num ${styles.size}`}>{formatNumber(trade.size, { maximumFractionDigits: 8 })}</span>
        </div>
    ));

    return (
        <CSPanel
            className="h-full"
            controls={
                <>
                    <PanelSource panelId={panelId} panelType={PanelType.Tape} />
                    <CSButton onClick={onRemove} square>
                        -
                    </CSButton>
                </>
            }
        >
            <div className={styles.head}>
                <span>TIME</span>
                <span>PRICE</span>
                <span className="text-right">SIZE</span>
            </div>
            <div className={`${styles.body} scroll`}>{tapeTable}</div>
        </CSPanel>
    );
};

export default ChartTape;
