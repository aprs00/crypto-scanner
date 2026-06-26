import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import type { LocalOrderBook } from '@/routes/~chart/types';

import type { ExchangeId, NormalizedTrade } from './types';

import { getExchange } from './registry';

const EMPTY_BOOK: LocalOrderBook = { asks: [], bids: [], lastUpdateId: 0 };

export const useExchangeSymbols = (id: ExchangeId) =>
    useQuery({
        queryFn: () => getExchange(id).fetchSymbols(),
        queryKey: ['exchange-symbols', id],
        staleTime: Infinity,
    });

export const useOrderBook = (exchange: ExchangeId, symbol: string): LocalOrderBook => {
    const [book, setBook] = useState<LocalOrderBook>(EMPTY_BOOK);

    useEffect(() => {
        if (!symbol) return;
        setBook(EMPTY_BOOK);
        return getExchange(exchange).subscribeOrderBook(symbol, setBook);
    }, [exchange, symbol]);

    return book;
};

// Accumulates the most recent `limit` trades, newest first.
export const useTrades = (exchange: ExchangeId, symbol: string, limit = 100): NormalizedTrade[] => {
    const [trades, setTrades] = useState<NormalizedTrade[]>([]);

    useEffect(() => {
        setTrades([]);
        if (!symbol) return;
        return getExchange(exchange).subscribeTrades(symbol, (trade) => {
            setTrades((prev) => [trade, ...prev].slice(0, limit));
        });
    }, [exchange, symbol, limit]);

    return trades;
};
