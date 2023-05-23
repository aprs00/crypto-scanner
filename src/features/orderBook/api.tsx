import {useEffect, useState} from 'react';
import ky from 'ky';
import {useQuery} from '@tanstack/react-query';

import {queryClient} from '@/lib/react-query';
import {groupOrders, updateOrderBook, shouldEventBeProcessed} from './utils';
import type {OrderBookResponseType, StreamAggTradeResponseType, ExchangeInfoResponseType} from './types';

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
        refetchInterval: firstEventProcessed ? 120_000 : 1_000,
    });
};

const useStreamTicker = (symbol: string, groupByVal: number, numOfRows: number) => {
    const [firstEventProcessed, setFirstEventProcessed] = useState(false);
    const [streamDataReceived, setStreamDataReceived] = useState(false);
    const depthSnapshot = useDepthSnapshot(symbol, streamDataReceived, firstEventProcessed);

    useEffect(() => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            setStreamDataReceived(true);
            const streamData = JSON.parse(event.data);
            const depthSnapshot = queryClient.getQueryData(['depth-snapshot', symbol]) as OrderBookResponseType;

            if (!shouldEventBeProcessed(depthSnapshot, streamData, firstEventProcessed, setFirstEventProcessed)) return;

            const {getter: updatedAsks} = updateOrderBook(depthSnapshot?.asks ?? [], streamData.a, true);
            const {getter: updatedBids} = updateOrderBook(depthSnapshot?.bids ?? [], streamData.b, false);

            const newLastUpdateId = streamData.u;

            const groupedAsks = groupOrders(updatedAsks, groupByVal, true, numOfRows);
            const groupedBids = groupOrders(updatedBids, groupByVal, false, numOfRows);

            const newDepthSnapshot = {
                lastUpdateId: newLastUpdateId,
                asks: updatedAsks,
                bids: updatedBids,
                groupedAsks: groupedAsks,
                groupedBids: groupedBids,
                firstEventProcessed: true,
            };

            queryClient.setQueryData(['depth-snapshot', symbol], newDepthSnapshot as OrderBookResponseType);
        };

        ws.onerror = (error) => {
            console.log('WebSocket error:', error);
        };

        return () => {
            ws.close();
            console.log('WebSocket disconnected');
        };
    }, [symbol]);

    return useQuery(['depth-snapshot', symbol], () => depthSnapshot ?? [], {
        enabled: !!symbol,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
};

const useStreamAggTrade = (symbol: string) => {
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
