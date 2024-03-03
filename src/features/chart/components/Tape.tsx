import {useEffect, useState} from 'react';

import {useStreamAggTrade} from '../api';
import type {TapeStateType} from '../types';
import TimeDisplay from './TimeDisplay';

const Tape = () => {
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
            <div>{data.price}</div>
            <div>{data.size}</div>
            <TimeDisplay timestamp={data.time} />
        </div>
    ));

    useEffect(() => {
        if (!streamAggTrade?.data?.p) return;
        if (!streamAggTrade || (Number(streamAggTrade?.data?.q) || 0) <= 0.05) return;
        const newTape = {
            price: streamAggTrade?.data?.p.toString().replace(/\.?0+$/, ''),
            size: streamAggTrade?.data?.q.toString().replace(/\.?0+$/, ''),
            time: streamAggTrade?.data?.T as number,
            aggregateTradeId: streamAggTrade?.data?.a,
            market: streamAggTrade?.data?.m,
        };
        setTapeData((prev) => [newTape, ...prev.slice(0, 100)]);
    }, [streamAggTrade?.data?.T]);

    return (
        <div className="border-4 border-slate-800 rounded h-full">
            <div id="drag-handle" className="flex items-center justify-between px-1 pb-1 bg-slate-800">
                <div className="">PRICE</div>
                <div className="">SIZE</div>
                <div className="">Time</div>
            </div>
            <div className="h-full overflow-none">{tapeTable}</div>
        </div>
    );
};

export default Tape;
