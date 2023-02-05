import axios from 'axios';
import {useQuery} from '@tanstack/react-query';

import type {OrderBookResponseType, StreamTickerResponseType} from '../types';
import {queryClient} from '@/lib/react-query';

const fetchDepthSnapshot = async (symbol: string) => {
    const response = await axios.get<OrderBookResponseType>(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=10`,
    );
    return response.data;
};

const streamTicker = async (symbol: string): Promise<StreamTickerResponseType> => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth`);

    return new Promise((resolve, reject) => {
        ws.onmessage = (event) => {
            queryClient.setQueriesData(['ticker', symbol], JSON.parse(event.data));
            resolve(JSON.parse(event.data));
        };

        ws.onerror = (error) => {
            console.log(error);
            reject(error);
        };
    });
};

const useDepthSnapshot = (symbol: string) => {
    return useQuery(['depthSnapshot', symbol], () => fetchDepthSnapshot(symbol), {
        enabled: !!symbol,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
};

const useStreamTicker = (symbol: string) => {
    return useQuery(['ticker', symbol], () => streamTicker(symbol), {
        enabled: !!symbol,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
};

export {useDepthSnapshot, useStreamTicker};
