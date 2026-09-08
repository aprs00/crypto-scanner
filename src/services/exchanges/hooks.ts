import { queryOptions, useQuery } from '@tanstack/react-query';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { createUiUpdateGate } from '@/utils/uiUpdateGate';

import type { ExchangeId, LocalOrderBook, NormalizedTrade } from './types';

import { getExchange } from './registry';
import { DepthFeedStatus, ExchangeId as Exchange } from './types';

const EMPTY_BOOK: LocalOrderBook = { asks: [], bids: [] };
const EMPTY_TRADES: NormalizedTrade[] = [];
const HYPERLIQUID_SYMBOL_REFRESH_MS = 60_000;

const exchangeSymbolsQueryOptions = (id: ExchangeId) =>
    queryOptions({
        queryFn: () => getExchange(id).fetchSymbols(),
        queryKey: ['exchange-symbols', id],
        refetchInterval: id === Exchange.Hyperliquid ? HYPERLIQUID_SYMBOL_REFRESH_MS : false,
        staleTime: id === Exchange.Hyperliquid ? HYPERLIQUID_SYMBOL_REFRESH_MS : Infinity,
    });

export const useExchangeSymbols = (id: ExchangeId) => useQuery(exchangeSymbolsQueryOptions(id));

export type UseOrderBookOptions = Readonly<{
    active?: boolean;
    publishIntervalMs?: number;
}>;

type PublishedOrderBook = Readonly<{
    book: LocalOrderBook;
    sourceKey: string;
}>;

export const useOrderBook = (
    exchange: ExchangeId,
    symbol: string,
    { active = true, publishIntervalMs = 0 }: UseOrderBookOptions = {},
): LocalOrderBook => {
    const sourceKey = `${exchange}:${symbol}`;
    const activeRef = useRef(active);
    const sourceKeyRef = useRef(sourceKey);
    const latestBookRef = useRef<LocalOrderBook>(EMPTY_BOOK);
    const latestHealthyRef = useRef(false);
    const gateRef = useRef<ReturnType<typeof createUiUpdateGate> | null>(null);
    const [published, setPublished] = useState<PublishedOrderBook>({ book: EMPTY_BOOK, sourceKey });

    useLayoutEffect(() => {
        activeRef.current = active;
        sourceKeyRef.current = sourceKey;
    }, [active, sourceKey]);

    useEffect(() => {
        latestBookRef.current = EMPTY_BOOK;
        latestHealthyRef.current = false;
        setPublished((current) =>
            current.sourceKey === sourceKey && current.book === EMPTY_BOOK ? current : { book: EMPTY_BOOK, sourceKey },
        );

        if (!symbol) return;

        const publishLatest = () => {
            if (!activeRef.current || sourceKeyRef.current !== sourceKey) return;
            const book = latestBookRef.current;
            setPublished((current) =>
                current.sourceKey === sourceKey && current.book === book ? current : { book, sourceKey },
            );
        };
        const gate = createUiUpdateGate(publishLatest, publishIntervalMs);
        gateRef.current = gate;

        const unsubscribe = getExchange(exchange).subscribeDepth(symbol, (state) => {
            if (sourceKeyRef.current !== sourceKey) return;

            if (state.status !== DepthFeedStatus.Healthy) {
                latestBookRef.current = EMPTY_BOOK;
                latestHealthyRef.current = false;
                gate.cancel();
                if (activeRef.current) publishLatest();
                return;
            }

            const wasHealthy = latestHealthyRef.current;
            latestBookRef.current = state.book;
            latestHealthyRef.current = true;
            if (!activeRef.current) return;
            if (wasHealthy) gate.request();
            else gate.flush();
        });

        return () => {
            unsubscribe();
            gate.cancel();
            if (gateRef.current === gate) gateRef.current = null;
        };
    }, [exchange, publishIntervalMs, sourceKey, symbol]);

    useEffect(() => {
        const gate = gateRef.current;
        if (!active) {
            gate?.cancel();
            return;
        }
        gate?.flush();
    }, [active, sourceKey]);

    return published.sourceKey === sourceKey ? published.book : EMPTY_BOOK;
};

export type UseTradesOptions = Readonly<{
    active?: boolean;
    limit?: number;
    publishIntervalMs?: number;
}>;

type PublishedTrades = Readonly<{
    sourceKey: string;
    trades: NormalizedTrade[];
}>;

// Accumulates the most recent trades at full feed speed while allowing UI
// consumers to publish only the newest bounded buffer at their chosen cadence.
export const useTrades = (
    exchange: ExchangeId,
    symbol: string,
    { active = true, limit = 100, publishIntervalMs = 0 }: UseTradesOptions = {},
): NormalizedTrade[] => {
    const sourceKey = `${exchange}:${symbol}`;
    const normalizedLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 100;
    const activeRef = useRef(active);
    const sourceKeyRef = useRef(sourceKey);
    const latestTradesRef = useRef<NormalizedTrade[]>(EMPTY_TRADES);
    const gateRef = useRef<ReturnType<typeof createUiUpdateGate> | null>(null);
    const [published, setPublished] = useState<PublishedTrades>({ sourceKey, trades: EMPTY_TRADES });

    useLayoutEffect(() => {
        activeRef.current = active;
        sourceKeyRef.current = sourceKey;
    }, [active, sourceKey]);

    useEffect(() => {
        latestTradesRef.current = EMPTY_TRADES;
        setPublished((current) =>
            current.sourceKey === sourceKey && current.trades === EMPTY_TRADES
                ? current
                : { sourceKey, trades: EMPTY_TRADES },
        );

        if (!symbol) return;

        const publishLatest = () => {
            if (!activeRef.current || sourceKeyRef.current !== sourceKey) return;
            const trades = latestTradesRef.current;
            setPublished((current) =>
                current.sourceKey === sourceKey && current.trades === trades ? current : { sourceKey, trades },
            );
        };
        const gate = createUiUpdateGate(publishLatest, publishIntervalMs);
        gateRef.current = gate;

        const unsubscribe = getExchange(exchange).subscribeTrades(symbol, (trade) => {
            if (sourceKeyRef.current !== sourceKey || normalizedLimit === 0) return;

            const trades = [trade, ...latestTradesRef.current];
            if (trades.length > normalizedLimit) trades.length = normalizedLimit;
            latestTradesRef.current = trades;
            if (activeRef.current) gate.request();
        });

        return () => {
            unsubscribe();
            gate.cancel();
            if (gateRef.current === gate) gateRef.current = null;
        };
    }, [exchange, normalizedLimit, publishIntervalMs, sourceKey, symbol]);

    useEffect(() => {
        const gate = gateRef.current;
        if (!active) {
            gate?.cancel();
            return;
        }
        gate?.flush();
    }, [active, sourceKey]);

    return published.sourceKey === sourceKey ? published.trades : EMPTY_TRADES;
};
