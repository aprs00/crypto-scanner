import { useEffect, useRef } from 'react';

import type { ExchangeId } from '@/services/exchanges/types';

import { receiptTimestamp } from '@/services/exchanges/_shared/observed-clock';
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
// React — the imperative paint loop reads the ref, while onChange only marks its
// canvas dirty.
const useTickHistory = (exchange: ExchangeId, symbol: string, onChange?: () => void) => {
    const ref = useRef<TickHistory>({ points: [], trades: [] });
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        const h = ref.current;
        // Fresh history per market — top-of-book has no backfill, it builds live.
        h.points = [];
        h.trades = [];
        if (!symbol) return;

        const ex = getExchange(exchange);

        const unsubBook = ex.subscribeBbo(symbol, (bbo) => {
            if (!Number.isFinite(bbo.bid) || !Number.isFinite(bbo.ask) || bbo.bid <= 0 || bbo.ask <= bbo.bid) return;
            const last = h.points[h.points.length - 1];
            if (last && last.bid === bbo.bid && last.ask === bbo.ask) return; // only record real changes
            h.points.push({ ask: bbo.ask, bid: bbo.bid, t: receiptTimestamp() });
            trim(h.points, MAX_POINTS);
            onChangeRef.current?.();
        });

        const unsubTrades = ex.subscribeTrades(symbol, (trade) => {
            if (!Number.isFinite(trade.price) || !Number.isFinite(trade.size) || trade.price <= 0 || trade.size <= 0)
                return;
            h.trades.push({ buy: !trade.isBuyerMaker, price: trade.price, size: trade.size, t: receiptTimestamp() });
            trim(h.trades, MAX_TRADES);
            onChangeRef.current?.();
        });

        return () => {
            unsubBook();
            unsubTrades();
        };
    }, [exchange, symbol]);

    return ref;
};

export default useTickHistory;
