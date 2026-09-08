import { useEffect, useRef, useState } from 'react';

import type { DepthState, ExchangeId } from '@/services/exchanges/types';

import { observedNow } from '@/lib/time/observedClock';
import { DepthFeedStatus } from '@/services/exchanges/types';

import type { SeriesVisibility } from '../shared/settings/types';
import type { LiquidityPreferences } from '../shared/settings/useChartSeriesStore';

import { LiquidityRenderCache } from './liquidityRender';
import {
    SPAN_DEFAULT,
    type PriceView,
    type Range,
    type TickView,
    PriceViewMode,
    clampSpan,
    clampView,
    panPriceRange,
    priceAtY,
    zoomPriceRange,
} from './tickChartMath';
import {
    BOOK_W,
    PAD_L,
    RIGHT_GUTTER,
    type Hover,
    type TickChartInteractionFrame,
    renderTickChart,
} from './tickChartRender';
import useDepthLiquidity from './useDepthLiquidity';
import useTickHistory from './useTickHistory';

type TickChartCanvasOptions = {
    exchange: ExchangeId;
    symbol: string;
    tickSize: number;
    liquidityPreferences: LiquidityPreferences;
    visibility: SeriesVisibility;
};

const DragIntent = {
    Both: 'both',
    Horizontal: 'horizontal',
    Pending: 'pending',
    PriceScale: 'price-scale',
    Vertical: 'vertical',
} as const;
type DragIntent = (typeof DragIntent)[keyof typeof DragIntent];

const DragZone = {
    Lower: 'lower',
    Main: 'main',
    PriceAxis: 'price-axis',
} as const;
type DragZone = (typeof DragZone)[keyof typeof DragZone];

type DragState = {
    anchorPrice: number | null;
    intent: DragIntent;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPriceRange: Range | null;
    startView: TickView;
    zone: DragZone;
};

const ZOOM_STEP = 0.85; // <1 zooms in (shorter window) on scroll up
const DRAG_THRESHOLD_PX = 5;
const AXIS_DOMINANCE = 1.5;
const PRICE_SCALE_PER_PX = 0.01; // ~2x span change for a 70px price-axis drag
const MAX_PAINT_FPS = 30;
const MIN_PAINT_INTERVAL = 1_000 / MAX_PAINT_FPS;

const makeLiveView = (): TickView => ({ endT: observedNow(), follow: true, spanMs: SPAN_DEFAULT });
const makeAutoPriceView = (): PriceView => ({ mode: PriceViewMode.Auto });

// Owns the tick chart's imperative canvas lifecycle: stream-backed refs, sizing,
// pointer/wheel interactions, and the RAF paint loop. The React component only
// renders panel controls and the canvas element.
const useTickChartCanvas = ({
    exchange,
    symbol,
    tickSize,
    liquidityPreferences,
    visibility,
}: TickChartCanvasOptions) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sizeRef = useRef({ h: 0, w: 0 });
    const viewRef = useRef<TickView>(makeLiveView());
    const priceViewRef = useRef<PriceView>(makeAutoPriceView());
    const interactionFrameRef = useRef<TickChartInteractionFrame | null>(null);
    const hoverRef = useRef<Hover>(null);
    const dragRef = useRef<DragState | null>(null);
    const dirtyRef = useRef(true);
    const inViewportRef = useRef(true);
    const depthStatusRef = useRef<DepthState['status']>(DepthFeedStatus.Syncing);
    const liquidityCacheRef = useRef<LiquidityRenderCache | null>(null);
    let liquidityCache = liquidityCacheRef.current;
    if (!liquidityCache) {
        liquidityCache = new LiquidityRenderCache();
        liquidityCacheRef.current = liquidityCache;
    }
    const liquidityPreferencesRef = useRef(liquidityPreferences);
    const tickSizeRef = useRef(tickSize);
    const visibilityRef = useRef(visibility);

    const [live, setLive] = useState(true);
    const [priceMode, setPriceMode] = useState<PriceView['mode']>(PriceViewMode.Auto);

    tickSizeRef.current = tickSize;
    visibilityRef.current = visibility;
    liquidityPreferencesRef.current = liquidityPreferences;

    const markDirty = () => {
        dirtyRef.current = true;
    };

    const setPriceView = (next: PriceView) => {
        const modeChanged = next.mode !== priceViewRef.current.mode;
        priceViewRef.current = next;
        if (modeChanged) setPriceMode(next.mode);
        markDirty();
    };

    const historyRef = useTickHistory(exchange, symbol, () => {
        // New live data cannot alter a window the user has explicitly paused.
        if (viewRef.current.follow) markDirty();
    });

    const handleDepthChange = (state: DepthState, liquidityChanged: boolean) => {
        const statusChanged = state.status !== depthStatusRef.current;
        depthStatusRef.current = state.status;
        if (statusChanged || visibilityRef.current.book || (liquidityChanged && visibilityRef.current.liquidity)) {
            markDirty();
        }
    };

    const { depthRef, timeline } = useDepthLiquidity({
        bookEnabled: visibility.book,
        exchange,
        liquidityEnabled: visibility.liquidity,
        onChange: handleDepthChange,
        symbol,
        tickSize,
    });

    const goLive = () => {
        viewRef.current = makeLiveView();
        setLive(true);
        markDirty();
    };

    const toggleCentered = () => {
        const current = priceViewRef.current;
        if (current.mode === PriceViewMode.Centered) {
            setPriceView(makeAutoPriceView());
            return;
        }
        const effectiveRange = interactionFrameRef.current?.priceRange;
        const sourceRange = effectiveRange ?? (current.mode === PriceViewMode.Manual ? current.range : null);
        setPriceView({
            mode: PriceViewMode.Centered,
            span: sourceRange ? sourceRange.hi - sourceRange.lo : null,
        });
    };

    const resetViews = () => {
        viewRef.current = makeLiveView();
        priceViewRef.current = makeAutoPriceView();
        setLive(true);
        setPriceMode(PriceViewMode.Auto);
        markDirty();
    };
    const resetViewsRef = useRef(resetViews);
    resetViewsRef.current = resetViews;

    useEffect(() => {
        if (!visibility.liquidity) liquidityCache.clear();
        dirtyRef.current = true;
    }, [liquidityPreferences, priceMode, tickSize, visibility]);

    // Reset the window whenever the market changes (history is rebuilt from scratch).
    useEffect(() => {
        viewRef.current = makeLiveView();
        hoverRef.current = null;
        dragRef.current = null;
        priceViewRef.current = makeAutoPriceView();
        interactionFrameRef.current = null;
        setLive(true);
        setPriceMode(PriceViewMode.Auto);
        liquidityCache.clear();
        dirtyRef.current = true;
    }, [exchange, symbol]);

    // Size the canvas backing store for high-DPI; keep CSS px in a ref for the loop.
    useEffect(() => {
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        if (!wrap || !canvas) return;

        const measure = () => {
            const r = wrap.getBoundingClientRect();
            const w = Math.floor(r.width);
            const h = Math.floor(r.height);
            const dpr = window.devicePixelRatio || 1;
            const backingW = Math.max(1, Math.round(w * dpr));
            const backingH = Math.max(1, Math.round(h * dpr));
            if (
                sizeRef.current.w === w &&
                sizeRef.current.h === h &&
                canvas.width === backingW &&
                canvas.height === backingH
            )
                return;
            sizeRef.current = { h, w };
            canvas.width = backingW;
            canvas.height = backingH;
            interactionFrameRef.current = null;
            liquidityCache.clear();
            dirtyRef.current = true;
        };

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(wrap);
        return () => ro.disconnect();
    }, []);

    // Canvas commands still consume main-thread time when their element is clipped
    // by the page or scroll container. Keep sampling history, but suspend paints.
    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([entry]) => {
            const next = entry?.isIntersecting ?? true;
            if (next === inViewportRef.current) return;
            inViewportRef.current = next;
            if (next) dirtyRef.current = true;
        });
        observer.observe(wrap);
        return () => observer.disconnect();
    }, []);

    // Main-pane drags pan one or both axes, lower panes pan time only, and the
    // price gutter scales Y. Intent is locked after a short dead zone so small
    // cross-axis pointer drift does not unexpectedly release the other pin.
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;

        const pointInElement = (clientX: number, clientY: number) => {
            const bounds = el.getBoundingClientRect();
            return { x: clientX - bounds.left, y: clientY - bounds.top };
        };

        const setCursor = (x: number, y: number) => {
            const frame = interactionFrameRef.current;
            if (!frame) {
                el.style.cursor = 'crosshair';
                return;
            }
            const inMainY = y >= frame.mainTop && y <= frame.mainBottom;
            if (inMainY && x >= frame.axisLeft && x <= frame.width) {
                el.style.cursor = 'ns-resize';
                return;
            }
            const inMainBody = inMainY && x >= frame.plotLeft && x < frame.priceBodyRight;
            const inLowerBody =
                y > frame.mainBottom && y <= sizeRef.current.h && x >= frame.plotLeft && x <= frame.plotRight;
            el.style.cursor = inMainBody || inLowerBody ? 'crosshair' : 'default';
        };

        const setManualRange = (range: Range) => {
            const modeChanged = priceViewRef.current.mode !== PriceViewMode.Manual;
            priceViewRef.current = { mode: PriceViewMode.Manual, range };
            if (modeChanged) setPriceMode(PriceViewMode.Manual);
            dirtyRef.current = true;
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const frame = interactionFrameRef.current;
            if (!frame) return;
            const point = pointInElement(e.clientX, e.clientY);
            const overPriceAxis =
                point.y >= frame.mainTop &&
                point.y <= frame.mainBottom &&
                point.x >= frame.axisLeft &&
                point.x <= frame.width;
            if (overPriceAxis && frame.priceRange) {
                const anchor = priceAtY(frame.priceRange, point.y, frame.mainTop, frame.mainBottom - frame.mainTop);
                const factor = e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP;
                setManualRange(zoomPriceRange(frame.priceRange, anchor, factor, tickSizeRef.current));
                return;
            }

            const v = viewRef.current;
            const newSpan = clampSpan(v.spanMs * (e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP));
            if (!v.follow) {
                const plotW = frame.plotRight - frame.plotLeft;
                const frac = plotW > 0 ? Math.min(1, Math.max(0, (point.x - frame.plotLeft) / plotW)) : 1;
                const anchorT = v.endT - v.spanMs + frac * v.spanMs;
                v.endT = anchorT + (1 - frac) * newSpan;
            }
            v.spanMs = newSpan;
            dirtyRef.current = true;
        };

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0 || !e.isPrimary) return;
            const frame = interactionFrameRef.current;
            if (!frame) return;
            const point = pointInElement(e.clientX, e.clientY);
            const inMainY = point.y >= frame.mainTop && point.y <= frame.mainBottom;
            let zone: DragZone | null = null;
            if (inMainY && point.x >= frame.axisLeft && point.x <= frame.width) zone = DragZone.PriceAxis;
            else if (inMainY && point.x >= frame.plotLeft && point.x < frame.priceBodyRight) zone = DragZone.Main;
            else if (
                point.y > frame.mainBottom &&
                point.y <= sizeRef.current.h &&
                point.x >= frame.plotLeft &&
                point.x <= frame.plotRight
            )
                zone = DragZone.Lower;
            if (!zone) return;

            const startPriceRange = frame.priceRange ? { ...frame.priceRange } : null;
            dragRef.current = {
                anchorPrice:
                    zone === DragZone.PriceAxis && startPriceRange
                        ? priceAtY(startPriceRange, point.y, frame.mainTop, frame.mainBottom - frame.mainTop)
                        : null,
                intent: DragIntent.Pending,
                pointerId: e.pointerId,
                startClientX: e.clientX,
                startClientY: e.clientY,
                startPriceRange,
                startView: { ...viewRef.current },
                zone,
            };
            hoverRef.current = null;
            el.style.cursor = zone === DragZone.PriceAxis ? 'ns-resize' : 'grabbing';
            el.setPointerCapture(e.pointerId);
            dirtyRef.current = true;
        };

        const onPointerMove = (e: PointerEvent) => {
            const drag = dragRef.current;
            const point = pointInElement(e.clientX, e.clientY);
            if (!drag) {
                const frame = interactionFrameRef.current;
                hoverRef.current =
                    frame &&
                    point.x >= frame.plotLeft &&
                    point.x <= frame.plotRight &&
                    point.y >= frame.mainTop &&
                    point.y <= frame.bottomY
                        ? point
                        : null;
                setCursor(point.x, point.y);
                dirtyRef.current = true;
                return;
            }

            hoverRef.current = null;
            const dx = e.clientX - drag.startClientX;
            const dy = e.clientY - drag.startClientY;
            if (drag.intent === DragIntent.Pending) {
                if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
                if (drag.zone === DragZone.PriceAxis) drag.intent = DragIntent.PriceScale;
                else if (drag.zone === DragZone.Lower) drag.intent = DragIntent.Horizontal;
                else if (Math.abs(dx) >= Math.abs(dy) * AXIS_DOMINANCE) drag.intent = DragIntent.Horizontal;
                else if (Math.abs(dy) >= Math.abs(dx) * AXIS_DOMINANCE) drag.intent = DragIntent.Vertical;
                else drag.intent = DragIntent.Both;

                if (drag.intent === DragIntent.Horizontal || drag.intent === DragIntent.Both) {
                    setLive(false);
                }
            }

            const frame = interactionFrameRef.current;
            if (!frame) return;
            if (drag.intent === DragIntent.Horizontal || drag.intent === DragIntent.Both) {
                const plotW = frame.plotRight - frame.plotLeft;
                if (plotW > 0) {
                    viewRef.current = {
                        endT: drag.startView.endT - dx * (drag.startView.spanMs / plotW),
                        follow: false,
                        spanMs: drag.startView.spanMs,
                    };
                }
            }
            if (drag.startPriceRange && (drag.intent === DragIntent.Vertical || drag.intent === DragIntent.Both)) {
                setManualRange(
                    panPriceRange(drag.startPriceRange, dy, frame.mainBottom - frame.mainTop, tickSizeRef.current),
                );
            } else if (drag.startPriceRange && drag.anchorPrice != null && drag.intent === DragIntent.PriceScale) {
                const exponent = Math.max(-6, Math.min(6, dy * PRICE_SCALE_PER_PX));
                setManualRange(
                    zoomPriceRange(drag.startPriceRange, drag.anchorPrice, Math.exp(exponent), tickSizeRef.current),
                );
            }
            dirtyRef.current = true;
        };

        const endDrag = (e?: PointerEvent) => {
            const drag = dragRef.current;
            if (!drag) return;
            try {
                el.releasePointerCapture(drag.pointerId);
            } catch {
                // pointer already released
            }
            dragRef.current = null;
            if (e) {
                const point = pointInElement(e.clientX, e.clientY);
                setCursor(point.x, point.y);
            } else {
                el.style.cursor = 'crosshair';
            }
            dirtyRef.current = true;
        };

        const onPointerLeave = () => {
            hoverRef.current = null;
            if (!dragRef.current) el.style.cursor = 'default';
            dirtyRef.current = true;
        };

        const onPointerCancel = () => endDrag();

        const onDoubleClick = (e: MouseEvent) => {
            e.preventDefault();
            resetViewsRef.current();
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', endDrag);
        el.addEventListener('pointercancel', onPointerCancel);
        el.addEventListener('pointerleave', onPointerLeave);
        el.addEventListener('dblclick', onDoubleClick);
        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', endDrag);
            el.removeEventListener('pointercancel', onPointerCancel);
            el.removeEventListener('pointerleave', onPointerLeave);
            el.removeEventListener('dblclick', onDoubleClick);
        };
    }, []);

    // Render loop: advance the right edge while following, clamp to available data,
    // and repaint only when something changed.
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        let raf = 0;
        let lastPaint = -Infinity;
        let lastFollowBucket = -Infinity;
        let lastFollowInterval = -Infinity;
        const draw = (frameTime: number, force = false) => {
            if (!force && !inViewportRef.current) return;
            const v = viewRef.current;
            let now = 0;
            if (v.follow) {
                now = observedNow();
                v.endT = now;
                const bookW = visibilityRef.current.book ? BOOK_W : 0;
                const plotW = sizeRef.current.w - PAD_L - bookW - RIGHT_GUTTER;
                const pixelMs = plotW > 0 ? v.spanMs / plotW : MIN_PAINT_INTERVAL;
                const followInterval = Math.max(MIN_PAINT_INTERVAL, pixelMs);
                const followBucket = Math.floor(now / followInterval);
                if (followInterval !== lastFollowInterval || followBucket !== lastFollowBucket) {
                    lastFollowInterval = followInterval;
                    lastFollowBucket = followBucket;
                    dirtyRef.current = true;
                }
            } else {
                lastFollowBucket = -Infinity;
                lastFollowInterval = -Infinity;
            }

            if (!dirtyRef.current) return;
            if (!force && frameTime - lastPaint < MIN_PAINT_INTERVAL - 0.5) return;
            if (!v.follow) now = observedNow();

            const history = historyRef.current;
            const firstTick = history.points.length ? history.points[0].t : Infinity;
            const firstLiquidity = timeline.count ? timeline.sample(0).t : Infinity;
            const earliest = Math.min(firstTick, firstLiquidity);
            const firstT = Number.isFinite(earliest) ? earliest : null;
            const clamped = clampView(v, firstT, now);
            if (clamped.follow !== v.follow) setLive(clamped.follow);
            v.endT = clamped.endT;
            v.follow = clamped.follow;

            const { w, h } = sizeRef.current;
            if (w <= 0 || h <= 0) return;
            dirtyRef.current = false;
            lastPaint = frameTime;

            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const interaction = renderTickChart(
                ctx,
                history,
                v,
                { h, w },
                tickSizeRef.current,
                hoverRef.current,
                depthRef.current,
                timeline,
                liquidityPreferencesRef.current,
                liquidityCache,
                priceViewRef.current,
                visibilityRef.current,
            );
            interactionFrameRef.current = interaction;
            const priceView = priceViewRef.current;
            if (priceView.mode === PriceViewMode.Centered && priceView.span == null && interaction?.priceRange) {
                priceViewRef.current = {
                    mode: PriceViewMode.Centered,
                    span: interaction.priceRange.hi - interaction.priceRange.lo,
                };
            }
        };

        const loop = (frameTime: number) => {
            raf = requestAnimationFrame(loop);
            draw(frameTime);
        };
        draw(performance.now(), true);
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [depthRef, historyRef, timeline]);

    return {
        canvasRef,
        centered: priceMode === PriceViewMode.Centered,
        depthRef,
        goLive,
        live,
        toggleCentered,
        wrapRef,
    };
};

export default useTickChartCanvas;
