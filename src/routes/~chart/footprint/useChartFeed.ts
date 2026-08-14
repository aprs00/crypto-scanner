import { useEffect, useRef, useState } from 'react';

import { SocketStatus } from '@/services/exchanges/_shared/multiplexed-socket';

import type { ChartBar, ChartBarsResponse, ChartScopedMessage } from './types';

import {
    applyChartUpdate,
    chartUpdateHasGap,
    emptyChartLiveState,
    mergeChartBars,
    type ChartLiveState,
} from './barState';
import { writeCachedBars } from './chartCache';
import chartSocket from './chartSocket';

type Options = {
    refreshSnapshot: () => Promise<boolean>;
    seriesKey: string | undefined;
    snapshot: ChartBarsResponse | undefined;
};

type ScopedLiveState = ChartLiveState & {
    seriesKey: string;
};

type ScopedBars = {
    bars: ChartBar[];
    seriesKey: string;
};

const EMPTY_BARS: ChartBar[] = [];

const useChartFeed = ({ refreshSnapshot, seriesKey, snapshot }: Options) => {
    const scopeKey = seriesKey ?? '';
    const [liveState, setLiveState] = useState<ScopedLiveState>({
        ...emptyChartLiveState(),
        seriesKey: '',
    });
    const [streamError, setStreamError] = useState<{ code: string | null; seriesKey: string }>({
        code: null,
        seriesKey: '',
    });
    const [transportStatus, setTransportStatus] = useState<SocketStatus>(SocketStatus.Closed);
    const [mergedBars, setMergedBars] = useState<ScopedBars>({ bars: EMPTY_BARS, seriesKey: '' });
    const liveStateRef = useRef(liveState);
    const refreshSnapshotRef = useRef(refreshSnapshot);
    const snapshotRef = useRef(snapshot);
    refreshSnapshotRef.current = refreshSnapshot;
    snapshotRef.current = snapshot;

    useEffect(() => {
        const handleTransportStatus = (status: SocketStatus) => setTransportStatus(status);
        return chartSocket.subscribeStatus(handleTransportStatus);
    }, []);

    useEffect(() => {
        let disposed = false;
        let refreshRequested = false;
        let refreshing = false;
        let retryDelayMs = 1_000;
        const refreshOnce = () => {
            refreshRequested = true;
            if (refreshing) return;
            refreshing = true;
            void (async () => {
                while (!disposed && refreshRequested) {
                    refreshRequested = false;
                    const success = await refreshSnapshotRef.current().catch(() => false);
                    if (!success && !disposed) {
                        refreshRequested = true;
                        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
                        retryDelayMs = Math.min(retryDelayMs * 2, 30_000);
                    } else {
                        retryDelayMs = 1_000;
                    }
                }
                refreshing = false;
            })();
        };
        const emptyState = { ...emptyChartLiveState(), seriesKey: scopeKey };
        liveStateRef.current = emptyState;
        setLiveState(emptyState);
        setStreamError({ code: null, seriesKey: scopeKey });
        if (!seriesKey) return;

        const handleMessage = (message: ChartScopedMessage) => {
            if (message.type === 'error') {
                setStreamError({ code: message.code, seriesKey: scopeKey });
                return;
            }
            setStreamError({ code: null, seriesKey: scopeKey });
            if (message.type === 'subscribed') {
                const nextState = { ...emptyChartLiveState(), seriesKey: scopeKey };
                liveStateRef.current = nextState;
                setLiveState(nextState);
                refreshOnce();
                return;
            }
            void writeCachedBars(scopeKey, message.bars).catch(() => undefined);
            const current =
                liveStateRef.current.seriesKey === scopeKey
                    ? liveStateRef.current
                    : { ...emptyChartLiveState(), seriesKey: scopeKey };
            if (chartUpdateHasGap(snapshotRef.current, current, message.bars, message.activeBar)) refreshOnce();
            const nextState = { ...applyChartUpdate(current, message.bars, message.activeBar), seriesKey: scopeKey };
            liveStateRef.current = nextState;
            setLiveState(nextState);
        };

        const unsubscribe = chartSocket.subscribe<ChartScopedMessage>({ seriesKey }, handleMessage);
        // A second panel for the same series shares the existing wire
        // subscription, so it will not receive another subscribed ack. Attach
        // its handler first, then refresh its snapshot to close the same gap.
        refreshOnce();
        return () => {
            disposed = true;
            unsubscribe();
        };
    }, [scopeKey, seriesKey]);

    useEffect(() => {
        const scopedLiveState = liveState.seriesKey === scopeKey ? liveState : emptyChartLiveState();
        setMergedBars({
            bars: seriesKey ? mergeChartBars(snapshot, scopedLiveState) : EMPTY_BARS,
            seriesKey: scopeKey,
        });
    }, [liveState, scopeKey, seriesKey, snapshot]);

    return {
        bars: mergedBars.seriesKey === scopeKey ? mergedBars.bars : EMPTY_BARS,
        reconnecting: Boolean(seriesKey && transportStatus !== SocketStatus.Open),
        streamError: streamError.seriesKey === scopeKey ? streamError.code : null,
    };
};

export default useChartFeed;
