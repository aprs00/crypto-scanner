import {useEffect, useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {queryClient} from '@/lib/react-query';

import {api} from '@/lib/ky';
import type {HeatmapResponseType} from './types';

const useStreamTable = () => {
    useEffect(() => {
        const url = new URL('/ws/crypto_scanner/table', 'wss://api.crypto-scanner.xyz');
        const jsonExample = {
            volume: {
                '30s': ['avg', 'sum', 'std.p'],
                '15m': ['twa', 'var.p', 'std.s'],
            },
            price: {
                '30s': ['avg', 'sum', 'std.p'],
                '15m': ['twa', 'var.p', 'std.s'],
            },
            trades: {
                '30s': ['avg', 'sum', 'std.p'],
                '15m': ['twa', 'var.p', 'std.s'],
            },
        };
        // url.searchParams.append('jsonObj', JSON.stringify(jsonExample));

        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('Table WebSocket connected');
        };

        ws.onmessage = (event) => {
            const streamData = JSON.parse(event.data);

            console.log(streamData);

            queryClient.setQueryData(['table-streams'], streamData);
        };

        ws.onerror = (error) => {
            console.log('Table WebSocket error:', error);
        };

        return () => {
            ws.close();
            console.log('Table WebSocket disconnected');
        };
    }, []);

    return queryClient.getQueryData(['table-streams']);
};
export {useStreamTable};
