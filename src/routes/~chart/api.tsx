import {useQuery} from '@tanstack/react-query';
import {useEffect, useRef, useState} from 'react';

import {binanceInstance} from '@/lib/api';
import queryClient from '@/lib/react-query';

import {
    DepthSnapshotParams,
    ExchangeInfoResponseType,
    OrderBookResponseType,
    StreamAggTradeResponseType,
} from './types';
import {groupOrders, isEventValid, updateOrderBook} from './utils';

const fetchExchangeInfo = async () => {
    const url = 'api/v3/exchangeInfo';

    const {data} = await binanceInstance.get<ExchangeInfoResponseType>(url);
    return data;
};

const useExchangeInfo = () => {
    return useQuery({
        queryFn: () => fetchExchangeInfo(),
        queryKey: ['exchange-info'],
        staleTime: Infinity,
    });
};

const fetchDepthSnapshot = async (params: DepthSnapshotParams) => {
    const url = 'api/v3/depth';

    const {data} = await binanceInstance.get<OrderBookResponseType>(url, {params});
    return data;
};

const useDepthSnapshot = (params: DepthSnapshotParams, firstEventProcessed: boolean) => {
    return useQuery({
        enabled: !!params.symbol,
        queryFn: () => fetchDepthSnapshot(params),
        queryKey: ['depth-snapshot', params],
        refetchInterval: firstEventProcessed ? 120_000 : 1_800,
        staleTime: Infinity,
    });
};

const useStreamTicker = (symbol: string, groupByVal = 1, numOfRows: number) => {
    const [firstEventProcessed, setFirstEventProcessed] = useState(() => false);
    useDepthSnapshot({limit: '5000', symbol}, firstEventProcessed);

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
                asks: updatedAsks,
                bids: updatedBids,
                groupedAsks: groupedAsks,
                groupedBids: groupedBids,
                lastUpdateId: streamData.u,
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

    return useQuery({
        enabled: !!symbol,
        queryFn: () => streamData ?? null,
        queryKey: ['ticker-agg-trade-stream', symbol],
        staleTime: Infinity,
    });
};

export {useDepthSnapshot, useExchangeInfo, useStreamAggTrade, useStreamTicker};
