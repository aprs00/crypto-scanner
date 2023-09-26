import {useEffect, useState, useRef} from 'react';
import ky from 'ky';
import {useQuery} from '@tanstack/react-query';

import {queryClient} from '@/lib/react-query';
import {groupOrders, updateOrderBook, isEventValid} from './utils';
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

export {useExchangeInfo, useDepthSnapshot, useStreamTicker, useStreamAggTrade};
