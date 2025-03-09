import {useEffect, useState} from 'react';

import {formatNumber} from '@/utils/number';

import {useStreamAggTrade} from '../api';
import type {TapeStateType} from '../types';
import TimeDisplay from './TimeDisplay';

const ChartTape = () => {
    const streamAggTrade = useStreamAggTrade('BTCUSDT');

    const [tapeData, setTapeData] = useState<TapeStateType[]>([]);

    const tapeTable = tapeData.map((data) => (
        <div
            className="flex justify-between text-xs px-1 py-px"
            key={data.aggregateTradeId}
            style={{
                color: data.market ? 'rgba(0, 215, 9, 1)' : 'rgba(215, 6, 6, 1)',
            }}
        >
            <div>{formatNumber(parseFloat(data.price), {})}</div>
            <div>{formatNumber(parseFloat(data.size), {maximumFractionDigits: 8})}</div>
            <TimeDisplay timestamp={data.time} />
        </div>
    ));

    useEffect(() => {
        if (!streamAggTrade.data?.p || (Number(streamAggTrade.data?.q) || 0) <= 0.01) return;

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
        <div className="border-4 border-slate-800 rounded h-full">
            <div className="flex items-center justify-between px-1 pb-1 bg-slate-800" id="drag-handle">
                <div>PRICE</div>
                <div>SIZE</div>
                <div>Time</div>
            </div>
            <div className="h-full overflow-none">{tapeTable}</div>
        </div>
    );
};

export default ChartTape;
