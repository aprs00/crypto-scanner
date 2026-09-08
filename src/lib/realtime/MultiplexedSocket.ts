type Handler = (data: unknown) => void;

export const SocketStatus = {
    Closed: 'closed',
    Connecting: 'connecting',
    Open: 'open',
} as const;
export type SocketStatus = (typeof SocketStatus)[keyof typeof SocketStatus];

interface MultiplexedSocketConfig<TSub> {
    url: string;
    subscribeFrame: (sub: TSub) => unknown;
    unsubscribeFrame: (sub: TSub) => unknown;
    // Stable key for dedup + dispatch; subscriptions sharing a key share one wire sub.
    keyOf: (sub: TSub) => string;
    // (key, payload) pairs to fan a message out to; empty = ack / heartbeat / not ours.
    route: (msg: unknown) => { key: string; data: unknown }[];
    pingFrame?: unknown;
    pingIntervalMs?: number;
    reconnectDelayMs?: number;
}

const DEFAULT_RECONNECT_DELAY_MS = 2_000;

// One ref-counted WebSocket: first handler for a key subscribes, last to leave
// unsubscribes, last key closes the socket. Active subs are replayed on reconnect.
class MultiplexedSocket<TSub> {
    private readonly cfg: MultiplexedSocketConfig<TSub>;
    private ws: WebSocket | null = null;
    private readonly handlers = new Map<string, Set<Handler>>();
    private readonly subs = new Map<string, TSub>();
    private pingTimer: ReturnType<typeof setInterval> | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly statusHandlers = new Set<(status: SocketStatus) => void>();
    private status: SocketStatus = SocketStatus.Closed;

    constructor(cfg: MultiplexedSocketConfig<TSub>) {
        this.cfg = cfg;
    }

    subscribe<T = unknown>(sub: TSub, handler: (data: T) => void): () => void {
        const key = this.cfg.keyOf(sub);
        // Each call is a distinct logical subscription, even when a caller
        // intentionally reuses the same callback function.
        const wrapped: Handler = (data) => handler(data as T);
        let set = this.handlers.get(key);
        if (!set) {
            set = new Set();
            this.handlers.set(key, set);
            this.subs.set(key, sub);
            this.ensureSocket();
            // No-op while CONNECTING; onopen replays everything.
            this.send(this.cfg.subscribeFrame(sub));
        }
        set.add(wrapped);

        let active = true;
        return () => {
            if (!active) return;
            active = false;
            const current = this.handlers.get(key);
            if (!current) return;
            current.delete(wrapped);
            if (current.size === 0) {
                this.handlers.delete(key);
                this.subs.delete(key);
                this.send(this.cfg.unsubscribeFrame(sub));
                if (this.handlers.size === 0) this.close();
            }
        };
    }

    subscribeStatus(handler: (status: SocketStatus) => void): () => void {
        const wrapped = (status: SocketStatus) => handler(status);
        this.statusHandlers.add(wrapped);
        wrapped(this.status);

        let active = true;
        return () => {
            if (!active) return;
            active = false;
            this.statusHandlers.delete(wrapped);
        };
    }

    private ensureSocket(): void {
        const open = this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING;
        if (!open) this.connect();
    }

    private connect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        const alreadyConnecting =
            this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING;
        if (alreadyConnecting) return;

        this.setStatus(SocketStatus.Connecting);
        const ws = new WebSocket(this.cfg.url);
        this.ws = ws;

        ws.onopen = () => {
            if (this.ws !== ws) {
                ws.close();
                return;
            }
            // Replay wire subscriptions before consumers begin any
            // snapshot/diff handshake in response to Open.
            for (const sub of this.subs.values()) this.send(this.cfg.subscribeFrame(sub));
            this.startPing();
            this.setStatus(SocketStatus.Open);
        };

        ws.onmessage = (event) => {
            if (this.ws !== ws) return;
            let msg: unknown;
            let routes: { key: string; data: unknown }[];
            try {
                msg = JSON.parse(event.data);
                routes = this.cfg.route(msg);
            } catch {
                // Continuing after an unparseable or unroutable market-data
                // frame could leave a non-consecutive feed silently divergent.
                // Reconnect so snapshot-backed subscriptions rebaseline.
                ws.close();
                return;
            }
            for (const r of routes) this.dispatch(r.key, r.data);
        };

        ws.onerror = () => ws.close();

        ws.onclose = () => {
            // A CLOSING socket can overlap a replacement connection. Its late
            // close must not tear down the current socket or schedule a second
            // reconnect.
            if (this.ws !== ws) return;
            this.stopPing();
            this.ws = null;
            this.setStatus(SocketStatus.Closed);
            if (this.handlers.size > 0) this.scheduleReconnect();
        };
    }

    private dispatch(key: string, data: unknown): void {
        const set = this.handlers.get(key);
        if (!set) return;
        for (const handler of set) handler(data);
    }

    private send(payload: unknown): void {
        if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
    }

    private startPing(): void {
        this.stopPing();
        if (this.cfg.pingFrame === undefined || !this.cfg.pingIntervalMs) return;
        this.pingTimer = setInterval(() => this.send(this.cfg.pingFrame), this.cfg.pingIntervalMs);
    }

    private stopPing(): void {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) return;
        const delay = this.cfg.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.handlers.size > 0) this.connect();
        }, delay);
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
        this.setStatus(SocketStatus.Closed);
    }

    private setStatus(status: SocketStatus): void {
        if (status === this.status) return;
        this.status = status;
        for (const handler of this.statusHandlers) handler(status);
    }
}

export default MultiplexedSocket;
