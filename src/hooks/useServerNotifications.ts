import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import env from '@/config/env';

const SocketMessageType = {
    ZscoreUpdated: 'zscore_updated',
    CorrelationsUpdated: 'correlations_updated',
} as const;

type SocketMessageType = (typeof SocketMessageType)[keyof typeof SocketMessageType];

interface SocketMessage {
    type: SocketMessageType;
}

interface UseServerNotificationsOptions {
    debounceMs: number;
    maxReconnectAttempts: number;
}

interface ConnectionState {
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    reconnectAttempts: number;
}

class ServerNotificationService {
    private ws: WebSocket | null = null;
    private reconnectTimeoutId: NodeJS.Timeout | null = null;
    private messageListeners: Set<(message: SocketMessage) => void> = new Set();
    private stateListeners: Set<(state: ConnectionState) => void> = new Set();
    private currentState: ConnectionState = {
        isConnected: false,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
    };
    private options: Required<UseServerNotificationsOptions>;
    private baseUrl: string;

    constructor(options: UseServerNotificationsOptions) {
        this.options = options;

        const wsUrl = env.baseWS || 'ws://localhost:8000';
        this.baseUrl = `${wsUrl}/ws/notifications/`;
    }

    connect(): void {
        if (this.ws?.readyState === WebSocket.CONNECTING || this.ws?.readyState === WebSocket.OPEN) {
            return;
        }

        this.updateState({ isConnecting: true, error: null });

        try {
            this.ws = new WebSocket(this.baseUrl);

            this.ws.onopen = () => {
                this.updateState({
                    isConnected: true,
                    isConnecting: false,
                    error: null,
                    reconnectAttempts: 0,
                });
            };

            this.ws.onclose = (event) => {
                this.updateState({
                    isConnected: false,
                    isConnecting: false,
                    error: event.code === 1000 ? null : `Connection closed with code: ${event.code}`,
                });

                if (event.code !== 1000 && this.currentState.reconnectAttempts < this.options.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            };

            this.ws.onerror = () => {
                this.updateState({
                    isConnected: false,
                    isConnecting: false,
                    error: 'WebSocket connection error',
                });
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: SocketMessage = JSON.parse(event.data);
                    this.messageListeners.forEach((listener) => listener(message));
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            };
        } catch (error) {
            this.updateState({
                isConnected: false,
                isConnecting: false,
                error: error instanceof Error ? error.message : 'Failed to create WebSocket connection',
            });
        }
    }

    disconnect(): void {
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Manual disconnect');
            this.ws = null;
        }

        this.updateState({
            isConnected: false,
            isConnecting: false,
            error: null,
            reconnectAttempts: 0,
        });
    }

    addMessageListener(listener: (message: SocketMessage) => void): () => void {
        this.messageListeners.add(listener);
        return () => this.messageListeners.delete(listener);
    }

    addStateListener(listener: (state: ConnectionState) => void): () => void {
        this.stateListeners.add(listener);
        listener(this.currentState);
        return () => this.stateListeners.delete(listener);
    }

    private updateState(newState: Partial<ConnectionState>): void {
        this.currentState = { ...this.currentState, ...newState };
        this.stateListeners.forEach((listener) => listener(this.currentState));
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
        }

        const delay = Math.min(1000 * Math.pow(2, this.currentState.reconnectAttempts), 30000);

        this.reconnectTimeoutId = setTimeout(() => {
            this.updateState({ reconnectAttempts: this.currentState.reconnectAttempts + 1 });
            this.connect();
        }, delay);
    }
}

let serviceInstance: ServerNotificationService | null = null;

function getServiceInstance(options: UseServerNotificationsOptions): ServerNotificationService {
    if (!serviceInstance) {
        serviceInstance = new ServerNotificationService(options);
    }
    return serviceInstance;
}

export function useServerNotifications(options: UseServerNotificationsOptions) {
    const queryClient = useQueryClient();
    const [connectionState, setConnectionState] = useState<ConnectionState>({
        isConnected: false,
        isConnecting: false,
        error: null,
        reconnectAttempts: 0,
    });

    const serviceRef = useRef<ServerNotificationService | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    if (!serviceRef.current) {
        serviceRef.current = getServiceInstance(options);
    }

    useEffect(() => {
        const service = serviceRef.current!;

        const stateUnsubscribe = service.addStateListener(setConnectionState);

        const messageUnsubscribe = service.addMessageListener((message) => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                switch (message.type) {
                    case SocketMessageType.ZscoreUpdated:
                        void queryClient.invalidateQueries({ queryKey: ['z-score-matrix'] });
                        void queryClient.invalidateQueries({ queryKey: ['z-score-heatmap'] });
                        void queryClient.invalidateQueries({ queryKey: ['z-score-history'] });
                        break;

                    case SocketMessageType.CorrelationsUpdated:
                        void queryClient.invalidateQueries({ queryKey: ['pearson-correlation'] });
                        void queryClient.invalidateQueries({ queryKey: ['correlation-pair-history'] });
                        break;

                    default:
                        console.warn('Unknown socket message type:', message.type);
                }
            }, options.debounceMs || 1000);
        });

        service.connect();

        return () => {
            stateUnsubscribe();
            messageUnsubscribe();

            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [queryClient, options.debounceMs]);

    return {
        connectionState,
        connect: () => serviceRef.current?.connect(),
        disconnect: () => serviceRef.current?.disconnect(),
    };
}

export default useServerNotifications;
