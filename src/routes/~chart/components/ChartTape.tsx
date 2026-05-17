import { useEffect, useState } from 'react';

import CSPanel from '@/components/Layouts/CSPanel';
import { formatNumber, formatPrice } from '@/utils/number';

import type { TapeStateType } from '../types';

import { useStreamAggTrade } from '../api';
import styles from './ChartTape.module.css';

const ChartTape = () => {
    const streamAggTrade = useStreamAggTrade('BTCUSDT');

    const [tapeData, setTapeData] = useState<TapeStateType[]>([]);

    const tapeTable = tapeData.map((data) => (
        <div className={styles.row} key={data.aggregateTradeId}>
            <span className="num dim">{new Date(data.time).toLocaleTimeString()}</span>
            <span className={`num ${data.market ? 'up' : 'down'}`}>{formatPrice(parseFloat(data.price))}</span>
            <span className={`num ${styles.size}`}>
                {formatNumber(parseFloat(data.size), { maximumFractionDigits: 8 })}
            </span>
        </div>
    ));

    useEffect(() => {
        if (!streamAggTrade.data?.p) return;

        const newTape = {
            aggregateTradeId: streamAggTrade.data.a,
            market: streamAggTrade.data.m,
            price: streamAggTrade.data.p.toString(),
            size: streamAggTrade.data.q.toString(),
            time: streamAggTrade.data.T as number,
        };

        setTapeData((prev) => [newTape, ...prev.slice(0, 100)]);
    }, [streamAggTrade.data?.T]);

    return (
        <CSPanel className="h-full" title="Time & Sales">
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
