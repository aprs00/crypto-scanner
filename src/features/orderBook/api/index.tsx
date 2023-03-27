import axios from 'axios';
import {useQuery} from '@tanstack/react-query';

import type {OrderBookResponseType, StreamTickerResponseType, StreamAggTradeResponseType} from '../types';
import {queryClient} from '@/lib/react-query';

const fetchDepthSnapshot = async (symbol: string, limit = 5000) => {
    const response = await axios.get<OrderBookResponseType>(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`,
    );
    return response.data;
};

const streamTicker = async (symbol: string): Promise<StreamTickerResponseType> => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`);

    return new Promise((resolve, reject) => {
        ws.onmessage = (event) => {
            queryClient.setQueriesData(['ticker-depth-stream', symbol], JSON.parse(event.data));
            resolve(JSON.parse(event.data));
        };

        ws.onerror = (error) => {
            console.log(error);
            reject(error);
        };
    });
};

const streamAggTrade = async (symbol: string): Promise<StreamAggTradeResponseType> => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@aggTrade`);

    return new Promise((resolve, reject) => {
        ws.onmessage = (event) => {
            queryClient.setQueriesData(['ticker-agg-trade-stream', symbol], JSON.parse(event.data));
            resolve(JSON.parse(event.data));
        };

        ws.onerror = (error) => {
            console.log(error);
            reject(error);
        };
    });
};

const useDepthSnapshot = (symbol: string, streamedEvent: boolean) => {
    return useQuery(['depth-snapshot', symbol], () => fetchDepthSnapshot(symbol), {
        enabled: !!symbol && streamedEvent,
        refetchOnWindowFocus: false,
    });
};

const useStreamTicker = (symbol: string) => {
    return useQuery(['ticker-depth-stream', symbol], () => streamTicker(symbol), {
        enabled: !!symbol,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
};

const useStreamAggTrade = (symbol: string) => {
    return useQuery(['ticker-agg-trade-stream', symbol], () => streamAggTrade(symbol), {
        enabled: !!symbol,
        refetchOnWindowFocus: false,
    });
};

export {fetchDepthSnapshot, useDepthSnapshot, useStreamTicker, useStreamAggTrade};
