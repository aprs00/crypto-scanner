import {useEffect, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {queryClient} from '@/lib/react-query';

import {API_WS_URL} from '@/config/env';

const useStreamTable = (selectedAggregations: string[]) => {
    const [streamData, setStreamData] = useState();

    useEffect(() => {
        const url = new URL('/ws/crypto_scanner/table', API_WS_URL);
        url.searchParams.set('aggregations', selectedAggregations.join(','));

        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('Table WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            queryClient.setQueryData(['table-streams'], data);
            setStreamData(data);
        };

        ws.onerror = (error) => {
            console.log('Table WebSocket error:', error);
        };

        return () => {
            ws.close();
            console.log('Table WebSocket disconnected');
        };
    }, [selectedAggregations]);

    return useQuery(['table-streams'], () => streamData ?? null, {
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
};

export {useStreamTable};
