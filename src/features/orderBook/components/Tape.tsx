import {useState, memo, useEffect, ReactNode} from 'react';

import TimeDisplay from './TimeDisplay';
import {useStreamAggTrade} from '../api';

const Tape = () => {
    const streamAggTrade = useStreamAggTrade('BTCUSDT');

    const [tapeTable, setTapeTable] = useState<ReactNode[]>([]);

    useEffect(() => {
        // if (!streamAggTrade || (Number(streamAggTrade?.data?.q) || 0) <= 0.1) return;
        if (!streamAggTrade?.data?.p) return;
        setTapeTable(
            (prev) =>
                [
                    <div
                        className="flex justify-between text-xs px-1 py-px"
                        key={crypto.randomUUID()}
                        style={{
                            color: streamAggTrade?.data?.m ? 'rgba(0, 215, 9, 1)' : 'rgba(215, 6, 6, 1)',
                        }}
                    >
                        <div>{streamAggTrade?.data?.p.toString().replace(/\.?0+$/, '')}</div>
                        <div>{streamAggTrade?.data?.q.toString().replace(/\.?0+$/, '')}</div>
                        <TimeDisplay timestamp={new Date(streamAggTrade?.data?.T as number)} />
                    </div>,
                    ...prev.slice(0, 100),
                ] as ReactNode[],
        );
    }, [streamAggTrade?.data?.T]);

    return (
        <div className="border-4 border-slate-800 rounded h-full">
            <div id="drag-handle" className="flex items-center justify-between px-1 pb-1 bg-slate-800">
                <div className="">PRICE</div>
                <div className="">SIZE</div>
                <div className="">Time</div>
            </div>
            <div>{tapeTable}</div>
        </div>
    );
};

export default memo(Tape);
