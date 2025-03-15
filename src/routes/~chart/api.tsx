import { binanceInstance } from '@/lib/api';
import queryClient from '@/lib/react-query';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { ExchangeInfoResponseType, StreamAggTradeResponseType } from './types';

const fetchExchangeInfo = async () => {
    const url = 'api/v3/exchangeInfo';

    const { data } = await binanceInstance.get<ExchangeInfoResponseType>(url);
    return data;
};

const useExchangeInfo = () => {
    return useQuery({
        queryFn: () => fetchExchangeInfo(),
        queryKey: ['exchange-info'],
        staleTime: Infinity,
    });
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

export { useExchangeInfo, useStreamAggTrade };
