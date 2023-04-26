import {memo, useEffect, useState} from 'react';

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

export default memo(TimeDisplay);
