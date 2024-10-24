import {memo, useEffect, useState} from 'react';

type TimeDisplayProps = {
    timestamp: number;
};

const TimeDisplay = (props: TimeDisplayProps) => {
    const {timestamp} = props;

    const [timeDiff, setTimeDiff] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000);
            setTimeDiff(diff);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timestamp]);

    const formatTimeDiff = (diff: number) => `${diff < 10 ? diff : diff} s ago`;

    return <div className="text-xs">{formatTimeDiff(timeDiff)}</div>;
};

export default memo(TimeDisplay);
