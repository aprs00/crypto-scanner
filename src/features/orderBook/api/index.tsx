import {useEffect, useState} from 'react';
import ky from 'ky';
import {useQuery, useQueryClient} from '@tanstack/react-query';

import type {
    OrderBookResponseType,
    StreamTickerResponseType,
    StreamAggTradeResponseType,
    ExchangeInfoResponseType,
} from '../types';

const fetchExchangeInfo = async (): Promise<ExchangeInfoResponseType> => {
    const data = (await ky.get(`https://api.binance.com/api/v3/exchangeInfo`).json()) as ExchangeInfoResponseType;
    return data;
};

const useExchangeInfo = () => {
    return useQuery(['exchange-info'], () => fetchExchangeInfo(), {
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
};

const fetchDepthSnapshot = async (symbol: string, limit = 5000): Promise<OrderBookResponseType> => {
    const data = (await ky
        .get(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`)
        .json()) as OrderBookResponseType;
    return data;
};

const useDepthSnapshot = (symbol: string, streamedEvent: boolean, firstEventProcessed: boolean) => {
    return useQuery(['depth-snapshot', symbol], () => fetchDepthSnapshot(symbol), {
        enabled: !!symbol && streamedEvent,
        refetchOnWindowFocus: false,
        refetchInterval: firstEventProcessed ? 17_000 : 1700,
    });
};

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

export {useExchangeInfo, useDepthSnapshot, useStreamTicker, useStreamAggTrade};
