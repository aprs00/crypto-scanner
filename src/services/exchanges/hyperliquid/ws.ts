const WS_URL = 'wss://api.hyperliquid.xyz/ws';
const PING_INTERVAL_MS = 30_000; // server drops idle sockets ~60s
const RECONNECT_DELAY_MS = 2_000;

type Handler = (data: any) => void;
type Subscription = { type: string; coin: string };

// Single shared socket for all Hyperliquid streams. Subscriptions are multiplexed
// by `${type}:${coin}`; the first subscriber for a key sends a subscribe frame and
// the last one to leave sends unsubscribe. On (re)connect every active subscription
// is replayed, so consumers transparently survive reconnects.
class HyperliquidWsManager {
    private static instance: HyperliquidWsManager | null = null;

    static get(): HyperliquidWsManager {
        if (!HyperliquidWsManager.instance) HyperliquidWsManager.instance = new HyperliquidWsManager();
        return HyperliquidWsManager.instance;
    }

    private ws: WebSocket | null = null;
    private handlers = new Map<string, Set<Handler>>();
    private subs = new Map<string, Subscription>();
    private pingTimer: ReturnType<typeof setInterval> | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    private keyOf(type: string, coin: string): string {
        return `${type}:${coin}`;
    }

    subscribe(type: string, coin: string, handler: Handler): () => void {
        const key = this.keyOf(type, coin);
        let set = this.handlers.get(key);
        if (!set) {
            set = new Set();
            this.handlers.set(key, set);
            this.subs.set(key, { coin, type });
            this.ensureSocket();
            // No-ops while CONNECTING; onopen replays all active subs.
            this.send({ method: 'subscribe', subscription: { coin, type } });
        }
        set.add(handler);

        return () => {
            const current = this.handlers.get(key);
            if (!current) return;
            current.delete(handler);
            if (current.size === 0) {
                this.handlers.delete(key);
                this.subs.delete(key);
                this.send({ method: 'unsubscribe', subscription: { coin, type } });
                if (this.handlers.size === 0) this.close();
            }
        };
    }

    private ensureSocket(): void {
        const open = this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING;
        if (!open) this.connect();
    }

    private connect(): void {
        const ws = new WebSocket(WS_URL);
        this.ws = ws;

        ws.onopen = () => {
            for (const sub of this.subs.values()) this.send({ method: 'subscribe', subscription: sub });
            this.startPing();
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.channel === 'l2Book') {
                this.dispatch(this.keyOf('l2Book', msg.data?.coin), msg.data);
            } else if (msg.channel === 'trades') {
                // trades payload is an array; route by the coin of the first trade.
                const coin = msg.data?.[0]?.coin;
                if (coin) this.dispatch(this.keyOf('trades', coin), msg.data);
            }
        };

        ws.onerror = () => ws.close();

        ws.onclose = () => {
            this.stopPing();
            this.ws = null;
            if (this.handlers.size > 0) this.scheduleReconnect();
        };
    }

    private dispatch(key: string, data: any): void {
        const set = this.handlers.get(key);
        if (!set) return;
        for (const handler of set) handler(data);
    }

    private send(payload: object): void {
        if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
    }

    private startPing(): void {
        this.stopPing();
        this.pingTimer = setInterval(() => this.send({ method: 'ping' }), PING_INTERVAL_MS);
    }

    private stopPing(): void {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.handlers.size > 0) this.connect();
        }, RECONNECT_DELAY_MS);
    }

    private close(): void {
        this.stopPing();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            this.ws.onopen = null;
            this.ws.close();
            this.ws = null;
        }
    }
}

export default HyperliquidWsManager;
