import { useEffect, useRef } from 'react';

import type { ExchangeId } from '@/services/exchanges/types';

import { getExchange } from '@/services/exchanges/registry';

import type { TickPoint, TradeMark } from './tickChartMath';

export type TickHistory = { points: TickPoint[]; trades: TradeMark[] };

// Bounded buffers: plenty of room to pan back without unbounded memory growth.
const MAX_POINTS = 20_000;
const MAX_TRADES = 20_000;
const TRIM_SLACK = 512; // trim in batches so we don't pay O(n) on every push

const trim = <T>(arr: T[], max: number) => {
    if (arr.length > max + TRIM_SLACK) arr.splice(0, arr.length - max);
};

// Accumulates a live tick history for the canvas chart. Subscribes directly to the
// exchange streams (rather than the useOrderBook/useTrades hooks, which would
// re-render on every message) and writes into a ref, so streaming never re-renders
// React — the RAF render loop reads the ref each frame.
const useTickHistory = (exchange: ExchangeId, symbol: string) => {
    const ref = useRef<TickHistory>({ points: [], trades: [] });

    useEffect(() => {
        const h = ref.current;
        // Fresh history per market — top-of-book has no backfill, it builds live.
        h.points = [];
        h.trades = [];
        if (!symbol) return;

        const ex = getExchange(exchange);

        const unsubBook = ex.subscribeBbo(symbol, (bbo) => {
            const last = h.points[h.points.length - 1];
            if (last && last.bid === bbo.bid && last.ask === bbo.ask) return; // only record real changes
            h.points.push({ ask: bbo.ask, bid: bbo.bid, t: Date.now() });
            trim(h.points, MAX_POINTS);
        });

        const unsubTrades = ex.subscribeTrades(symbol, (trade) => {
            h.trades.push({ buy: !trade.isBuyerMaker, price: trade.price, size: trade.size, t: Date.now() });
            trim(h.trades, MAX_TRADES);
        });

        return () => {
            unsubBook();
            unsubTrades();
        };
    }, [exchange, symbol]);

    return ref;
};

export default useTickHistory;
