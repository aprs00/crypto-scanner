import {useQuery} from '@tanstack/react-query';
import {useEffect, useRef, useState} from 'react';

import {BINANCE_API_URL} from '@/config/env';
import {api} from '@/lib/ky';
import {queryClient} from '@/lib/react-query';

import type {ExchangeInfoResponseType, OrderBookResponseType, StreamAggTradeResponseType} from './types';
import {groupOrders, isEventValid, updateOrderBook} from './utils';

const fetchExchangeInfo = async () => {
    const url = new URL('api/v3/exchangeInfo', BINANCE_API_URL);
    return (await api.get(url).json()) as ExchangeInfoResponseType;
};

const useExchangeInfo = () => {
    return useQuery(['exchange-info'], () => fetchExchangeInfo(), {
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
};

const fetchDepthSnapshot = async (symbol: string, limit = 5000) => {
    const url = new URL('api/v3/depth', BINANCE_API_URL);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('limit', limit.toString());

    return (await api.get(url).json()) as OrderBookResponseType;
};

const useDepthSnapshot = (symbol: string, firstEventProcessed: boolean) => {
    return useQuery(['depth-snapshot', symbol], () => fetchDepthSnapshot(symbol), {
        enabled: !!symbol,
        refetchOnWindowFocus: false,
        refetchInterval: firstEventProcessed ? 120_000 : 1_800,
    });
};

const useStreamTicker = (symbol: string, groupByVal = 1, numOfRows: number) => {
    const [firstEventProcessed, setFirstEventProcessed] = useState(() => false);
    useDepthSnapshot(symbol, firstEventProcessed);

    const groupByValRef = useRef(groupByVal);
    const numOfRowsRef = useRef(numOfRows);

    useEffect(() => {
        groupByValRef.current = groupByVal;
        numOfRowsRef.current = numOfRows;
    }, [groupByVal, numOfRows]);

    useEffect(() => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth@100ms`);

        ws.onopen = () => {
            console.log('Orderbook WebSocket connected');
        };

        ws.onmessage = (event) => {
            const streamData = JSON.parse(event.data);
            const depthSnapshotCache = queryClient.getQueryData(['depth-snapshot', symbol]) as OrderBookResponseType;

            if (!isEventValid(depthSnapshotCache, streamData, firstEventProcessed, setFirstEventProcessed)) return;

            const {getter: updatedAsks} = updateOrderBook(depthSnapshotCache.asks, streamData.a, true);
            const {getter: updatedBids} = updateOrderBook(depthSnapshotCache.bids, streamData.b, false);

            const groupedAsks = groupOrders(updatedAsks, groupByValRef.current, true, numOfRowsRef.current);
            const groupedBids = groupOrders(updatedBids, groupByValRef.current, false, numOfRowsRef.current);

            const newDepthSnapshot = {
                lastUpdateId: streamData.u,
                asks: updatedAsks,
                bids: updatedBids,
                groupedAsks: groupedAsks,
                groupedBids: groupedBids,
            };

            queryClient.setQueryData(['depth-snapshot', symbol], newDepthSnapshot);
        };

        ws.onerror = (error) => {
            console.log('Orderbook WebSocket error:', error);
        };

        return () => {
            ws.close();
            console.log('Orderbook WebSocket disconnected');
        };
    }, [symbol]);

    return queryClient.getQueryData(['depth-snapshot', symbol]) as OrderBookResponseType;
};

const useStreamAggTrade = (symbol: string) => {
    const [streamData, setStreamData] = useState<StreamAggTradeResponseType>();

    useEffect(() => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@aggTrade`);

        ws.onopen = () => {
            console.log('Trades WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            queryClient.setQueryData(['ticker-agg-trade-stream', symbol], data);
            setStreamData(data);
        };

        ws.onerror = (error) => {
            console.log('Trades WebSocket error:', error);
        };

        return () => {
            ws.close();
            console.log('Trades WebSocket disconnected');
        };
    }, [queryClient, symbol]);

    return useQuery(['ticker-agg-trade-stream', symbol], () => streamData ?? null, {
        enabled: !!symbol,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
    });
};

export {useDepthSnapshot, useExchangeInfo, useStreamAggTrade, useStreamTicker};
