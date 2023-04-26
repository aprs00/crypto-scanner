import {useEffect, useState} from 'react';
import ky from 'ky';
import {useQuery, useQueryClient} from '@tanstack/react-query';

import type {OrderBookResponseType, StreamTickerResponseType, StreamAggTradeResponseType} from '../types';
import {queryClient} from '@/lib/react-query';

const fetchDepthSnapshot = async (symbol: string, limit = 5000): Promise<OrderBookResponseType> => {
    const data = (await ky
        .get(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`)
        .json()) as OrderBookResponseType;
    console.log('depth snapshot', data);
    return data;
};

const useDepthSnapshot = (symbol: string, streamedEvent: boolean) => {
    return useQuery(['depth-snapshot', symbol], () => fetchDepthSnapshot(symbol), {
        enabled: !!symbol && streamedEvent,
        refetchOnWindowFocus: false,
    });
};

// const streamTicker = async (symbol: string): Promise<StreamTickerResponseType> => {
//     const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`);

//     return new Promise((resolve, reject) => {
//         ws.onmessage = (event) => {
//             queryClient.setQueriesData(['ticker-depth-stream', symbol], JSON.parse(event.data));
//             resolve(JSON.parse(event.data));
//         };

//         ws.onerror = (error) => {
//             console.log(error);
//             reject(error);
//         };
//     });
// };

// const useStreamTicker = (symbol: string) => {
//     return useQuery(['ticker-depth-stream', symbol], () => streamTicker(symbol), {
//         enabled: !!symbol,
//         refetchOnWindowFocus: false,
//         staleTime: Infinity,
//     });
// };

const useStreamTicker = (symbol: string) => {
    const queryClient = useQueryClient();
    const [streamData, setStreamData] = useState<StreamTickerResponseType>();

    useEffect(() => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            queryClient.setQueryData(['ticker-depth-stream', symbol], data);
            setStreamData(data);
        };

        ws.onerror = (error) => {
            console.log('WebSocket error:', error);
        };

        return () => {
            ws.close();
            console.log('WebSocket disconnected');
        };
    }, [queryClient, symbol]);

    return useQuery(['ticker-depth-stream', symbol], () => streamData ?? [], {
        enabled: !!symbol,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
};

const useStreamAggTrade = (symbol: string) => {
    const queryClient = useQueryClient();
    const [streamData, setStreamData] = useState<StreamAggTradeResponseType>();

    useEffect(() => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@aggTrade`);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            queryClient.setQueryData(['ticker-agg-trade-stream', symbol], data);
            setStreamData(data);
        };

        ws.onerror = (error) => {
            console.log('WebSocket error:', error);
        };

        return () => {
            ws.close();
            console.log('WebSocket disconnected');
        };
    }, [queryClient, symbol]);

    return useQuery(['ticker-agg-trade-stream', symbol], () => streamData ?? null, {
        enabled: !!symbol,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
};

export {fetchDepthSnapshot, useDepthSnapshot, useStreamTicker, useStreamAggTrade};
