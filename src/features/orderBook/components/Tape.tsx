import {useState, memo, useEffect, ReactNode} from 'react';

import {useStreamAggTrade} from '../api';

const TimeDisplay = ({timestamp}: {timestamp: Date}) => {
    const [timeDiff, setTimeDiff] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
            setTimeDiff(diff);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timestamp]);

    const formatTimeDiff = (diff: number) => {
        return `${diff < 10 ? diff : diff} s ago`;
    };

    return <div className="text-xs">{formatTimeDiff(timeDiff)}</div>;
};

const OrderBookTable = () => {
    const streamAggTrade = useStreamAggTrade('BTCUSDT');

    const [tapeTable, setTapeTable] = useState<ReactNode[]>([]);

    useEffect(() => {
        if (!streamAggTrade || (Number(streamAggTrade?.data?.q) || 0) <= 0.1) return;
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
                    ...prev.slice(0, 30),
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

export default memo(OrderBookTable);

{
    /* 
<div className="my-4 text-xl">
{parseFloat(streamAggTradePrice || '0')
.toString()
.replace(/\.?0+$/, '')}
</div> 
*/
}
