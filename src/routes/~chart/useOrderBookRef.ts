import { useEffect, useRef } from 'react';

import type { ExchangeId } from '@/services/exchanges/types';

import { getExchange } from '@/services/exchanges/registry';

import type { LocalOrderBook } from './types';

const EMPTY_BOOK: LocalOrderBook = { asks: [], bids: [], lastUpdateId: 0 };

// Keeps the latest order book in a ref so the tick chart's RAF render loop can read
// it each frame without re-rendering React. Mirrors useTickHistory: it subscribes to
// the raw stream rather than useOrderBook (which setStates on every message). The
// optional `onChange` lets the chart mark itself dirty so the book column keeps
// repainting even when the view is paused (not following live). Held in a ref so a
// fresh callback identity never re-subscribes the stream.
const useOrderBookRef = (exchange: ExchangeId, symbol: string, onChange?: () => void) => {
    const ref = useRef<LocalOrderBook>(EMPTY_BOOK);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        ref.current = EMPTY_BOOK;
        if (!symbol) return;
        return getExchange(exchange).subscribeOrderBook(symbol, (book) => {
            ref.current = book;
            onChangeRef.current?.();
        });
    }, [exchange, symbol]);

    return ref;
};

export default useOrderBookRef;
