import { useEffect, useLayoutEffect, useRef } from 'react';

import type { DepthState, ExchangeId } from '@/services/exchanges/types';

import { receiptTimestamp } from '@/services/exchanges/_shared/observed-clock';
import { getExchange } from '@/services/exchanges/registry';
import { DepthFeedStatus, EMPTY_DEPTH_COVERAGE } from '@/services/exchanges/types';

import { LiquidityTimeline } from './liquidityModel';

export const EMPTY_DEPTH_STATE: DepthState = {
    book: { asks: [], bids: [] },
    coverage: EMPTY_DEPTH_COVERAGE,
    generation: 0,
    status: DepthFeedStatus.Syncing,
};

type DepthLiquidityOptions = {
    bookEnabled: boolean;
    exchange: ExchangeId;
    liquidityEnabled: boolean;
    onChange: (state: DepthState, liquidityChanged: boolean) => void;
    symbol: string;
    tickSize: number;
};

// One subscription supplies both the current BOOK column and LIQ sampling. The
// timeline owns panel-private history; the exchange adapter owns shared canonical
// acquisition and synchronization.
const useDepthLiquidity = ({
    bookEnabled,
    exchange,
    liquidityEnabled,
    onChange,
    symbol,
    tickSize,
}: DepthLiquidityOptions) => {
    const depthRef = useRef<DepthState>(EMPTY_DEPTH_STATE);
    const onChangeRef = useRef(onChange);
    const liquidityEnabledRef = useRef(liquidityEnabled);
    const timelineRef = useRef<LiquidityTimeline | null>(null);
    if (!timelineRef.current)
        timelineRef.current = new LiquidityTimeline(() => onChangeRef.current(depthRef.current, true));

    useLayoutEffect(() => {
        onChangeRef.current = onChange;
        liquidityEnabledRef.current = liquidityEnabled;
    }, [liquidityEnabled, onChange]);

    const needDepth = bookEnabled || liquidityEnabled;
    const identity = `${exchange}:${symbol}:${tickSize}`;

    useEffect(() => {
        depthRef.current = EMPTY_DEPTH_STATE;
        onChangeRef.current(depthRef.current, false);
        if (!needDepth || !symbol) return;
        return getExchange(exchange).subscribeDepth(symbol, (state) => {
            depthRef.current = state;
            if (liquidityEnabledRef.current) timelineRef.current?.observe(state, receiptTimestamp());
            onChangeRef.current(state, false);
        });
    }, [exchange, needDepth, symbol]);

    useEffect(() => {
        const timeline = timelineRef.current;
        if (!timeline) return;
        if (!liquidityEnabled) {
            timeline.disable();
            return;
        }
        timeline.enable(identity, tickSize);
        if (depthRef.current.status === DepthFeedStatus.Healthy) {
            timeline.observe(depthRef.current, receiptTimestamp());
        }
        return () => timeline.disable();
    }, [identity, liquidityEnabled, tickSize]);

    return { depthRef, timeline: timelineRef.current };
};

export default useDepthLiquidity;
