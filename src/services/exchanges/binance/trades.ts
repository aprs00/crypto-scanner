import type { StreamAggTradeResponseType } from '@/routes/~chart/types';

import type { NormalizedTrade } from '../types';

type Subscriber = (trade: NormalizedTrade) => void;

// One shared @aggTrade socket per symbol, multiplexed across consumers — mirrors
// the OrderBookStream pattern so N panels on the same symbol share one socket.
class AggTradeStream {
    private static streams = new Map<string, AggTradeStream>();

    static getOrCreate(symbol: string): AggTradeStream {
        const key = symbol.toLowerCase();
        let stream = AggTradeStream.streams.get(key);
        if (!stream) {
            stream = new AggTradeStream(key);
            AggTradeStream.streams.set(key, stream);
        }
        return stream;
    }

    private readonly symbol: string;
    private ws: WebSocket | null = null;
    private subscribers = new Set<Subscriber>();

    private constructor(symbol: string) {
        this.symbol = symbol;
    }

    subscribe(cb: Subscriber): void {
        this.subscribers.add(cb);
        if (this.subscribers.size === 1) this.connect();
    }

    unsubscribe(cb: Subscriber): void {
        this.subscribers.delete(cb);
        if (this.subscribers.size === 0) {
            this.disconnect();
            AggTradeStream.streams.delete(this.symbol);
        }
    }

    private connect(): void {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${this.symbol}@aggTrade`);
        this.ws = ws;

        ws.onmessage = (event) => {
            const t: StreamAggTradeResponseType = JSON.parse(event.data);
            const trade: NormalizedTrade = {
                id: t.a,
                isBuyerMaker: t.m,
                price: +t.p,
                size: +t.q,
                time: t.T,
            };
            for (const cb of this.subscribers) cb(trade);
        };
    }

    private disconnect(): void {
        if (this.ws) {
            this.ws.onmessage = null;
            this.ws.close();
            this.ws = null;
        }
    }
}

export const subscribeAggTrades = (symbol: string, cb: Subscriber): (() => void) => {
    const stream = AggTradeStream.getOrCreate(symbol);
    stream.subscribe(cb);
    return () => stream.unsubscribe(cb);
};
