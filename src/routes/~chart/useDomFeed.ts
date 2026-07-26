import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { DepthFeedStatus as DepthFeedStatusType, ExchangeId } from '@/services/exchanges/types';
import type { UiUpdateGate } from '@/utils/uiUpdateGate';

import { getExchange } from '@/services/exchanges/registry';
import { DepthFeedStatus } from '@/services/exchanges/types';
import { createUiUpdateGate } from '@/utils/uiUpdateGate';

import type { DomFeedSnapshot, DomView } from './domFeedEngine';

import DomFeedEngine, { EMPTY_DOM_FEED_SNAPSHOT } from './domFeedEngine';
import { stabilizeDomRows } from './domModel';

type UseDomFeedOptions = {
    active?: boolean;
    centerTick?: number | null;
    exchange: ExchangeId;
    groupTicks: number;
    includeTape: boolean;
    pullStackRowCount?: number;
    rowCount: number;
    symbol: string;
    tickSize: number;
};

type ActiveEngine = {
    engine: DomFeedEngine;
    sourceKey: string;
};

type PublishedSnapshot = {
    snapshot: DomFeedSnapshot;
    sourceKey: string;
};

const DOM_PUBLISH_INTERVAL_MS = 100;

const stabilizeSnapshot = (previous: DomFeedSnapshot, next: DomFeedSnapshot): DomFeedSnapshot => {
    const rows = stabilizeDomRows(previous.rows, next.rows);
    if (
        previous.activityStartedAt === next.activityStartedAt &&
        previous.marketCenterTick === next.marketCenterTick &&
        previous.recentTrades === next.recentTrades &&
        previous.rows === rows &&
        previous.status === next.status
    ) {
        return previous;
    }
    return { ...next, rows };
};

const useDomFeed = ({
    active = true,
    centerTick,
    exchange,
    groupTicks,
    includeTape,
    pullStackRowCount,
    rowCount,
    symbol,
    tickSize,
}: UseDomFeedOptions) => {
    const sourceKey = `${exchange}:${symbol}:${tickSize}`;
    const viewRef = useRef<DomView>({ centerTick, groupTicks, includeTape, pullStackRowCount, rowCount });
    const activeRef = useRef(active);
    const engineRef = useRef<ActiveEngine | null>(null);
    if (!engineRef.current) {
        const engine = new DomFeedEngine(groupTicks, tickSize);
        engine.setTapeCollectionEnabled(includeTape);
        engineRef.current = {
            engine,
            sourceKey,
        };
    }
    const gateRef = useRef<UiUpdateGate | null>(null);
    const [published, setPublished] = useState<PublishedSnapshot>(() => ({
        snapshot: engineRef.current?.engine.snapshot(viewRef.current) ?? EMPTY_DOM_FEED_SNAPSHOT,
        sourceKey,
    }));

    useEffect(() => {
        const engine = new DomFeedEngine(viewRef.current.groupTicks, tickSize);
        engine.setTapeCollectionEnabled(viewRef.current.includeTape);
        let disposed = false;
        let depthStatus: DepthFeedStatusType = DepthFeedStatus.Syncing;

        engineRef.current = { engine, sourceKey };

        const publish = () => {
            if (disposed || !activeRef.current) return;
            const next = engine.snapshot(viewRef.current);
            setPublished((previous) => {
                const snapshot = previous.sourceKey === sourceKey ? stabilizeSnapshot(previous.snapshot, next) : next;
                return previous.sourceKey === sourceKey && previous.snapshot === snapshot
                    ? previous
                    : { snapshot, sourceKey };
            });
        };

        const gate = createUiUpdateGate(publish, DOM_PUBLISH_INTERVAL_MS);
        gateRef.current = gate;
        setPublished({ snapshot: engine.snapshot(viewRef.current), sourceKey });

        let unsubscribeDepth: () => void = () => undefined;
        let unsubscribeTrades: () => void = () => undefined;
        if (symbol && tickSize > 0 && Number.isFinite(tickSize) && viewRef.current.groupTicks > 0) {
            const adapter = getExchange(exchange);
            unsubscribeDepth = adapter.subscribeDepth(symbol, (state) => {
                const statusChanged = state.status !== depthStatus;
                depthStatus = state.status;
                engine.acceptDepth(state);
                if (!activeRef.current) return;
                if (statusChanged) gate.flush();
                else gate.request();
            });
            unsubscribeTrades = adapter.subscribeTrades(symbol, (trade) => {
                if (engine.acceptTrade(trade) && activeRef.current) gate.request();
            });
        }

        return () => {
            disposed = true;
            unsubscribeDepth();
            unsubscribeTrades();
            gate.cancel();
            if (gateRef.current === gate) gateRef.current = null;
        };
    }, [exchange, sourceKey, symbol, tickSize]);

    useLayoutEffect(() => {
        viewRef.current = { centerTick, groupTicks, includeTape, pullStackRowCount, rowCount };
        activeRef.current = active;
        const current = engineRef.current;
        if (!current || current.sourceKey !== sourceKey) return;
        current.engine.setTapeCollectionEnabled(includeTape);
        current.engine.regroup(groupTicks);
        if (!active) {
            gateRef.current?.cancel();
            return;
        }
        gateRef.current?.flush();
    }, [active, centerTick, groupTicks, includeTape, pullStackRowCount, rowCount, sourceKey]);

    const clearActivity = () => {
        const current = engineRef.current;
        if (!current || current.sourceKey !== sourceKey) return;
        current.engine.clearActivity();
        gateRef.current?.flush();
    };

    const snapshot = published.sourceKey === sourceKey ? published.snapshot : EMPTY_DOM_FEED_SNAPSHOT;
    return { clearActivity, snapshot };
};

export default useDomFeed;
