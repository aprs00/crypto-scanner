import env from '@/config/env';
import MultiplexedSocket from '@/lib/realtime/MultiplexedSocket';

import { chartSocketMessageSchema, type ChartScopedMessage } from './types';

type ChartSubscription = {
    seriesKey: string;
};

const base = (env.baseWS || 'ws://localhost:8000').replace(/\/$/u, '');

const chartSocket = new MultiplexedSocket<ChartSubscription>({
    keyOf: ({ seriesKey }) => seriesKey,
    reconnectDelayMs: 1_000,
    route: (message) => {
        const parsed = chartSocketMessageSchema.parse(message);
        return [{ data: parsed satisfies ChartScopedMessage, key: parsed.seriesKey }];
    },
    subscribeFrame: ({ seriesKey }) => ({
        op: 'subscribe',
        seriesKey,
    }),
    unsubscribeFrame: ({ seriesKey }) => ({
        op: 'unsubscribe',
        seriesKey,
    }),
    url: `${base}/ws/v1/charts/`,
});

export default chartSocket;
