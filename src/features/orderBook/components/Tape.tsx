import {useState, memo, useEffect, ReactNode} from 'react';

import TimeDisplay from './TimeDisplay';
import {useStreamAggTrade} from '../api';

const Tape = () => {
    const streamAggTrade = useStreamAggTrade('BTCUSDT');

    const [tapeTable, setTapeTable] = useState<ReactNode[]>([]);

    useEffect(() => {
        // if (!streamAggTrade || (Number(streamAggTrade?.data?.q) || 0) <= 0.1) return;
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
        <>
            <div className="flex justify-between border-b border-slate-600 mb-1 text-sm p-1">
                <div className="">PRICE</div>
                <div className="">SIZE</div>
                <div className="">Time</div>
            </div>
            <div>{tapeTable}</div>
        </>
    );
};

export default memo(Tape);

{
    /* 
<div className="my-4 text-xl">
{parseFloat(streamAggTradePrice || '0')
.toString()
.replace(/\.?0+$/, '')}
</div> 
*/
}
