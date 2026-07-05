import { useCallback, useEffect, useRef, useState } from 'react';

import type { ExchangeId } from '@/services/exchanges/types';

import type { SeriesVisibility } from './types';

import { SPAN_DEFAULT, type TickView, clampSpan, clampView } from './tickChartMath';
import { BOOK_W, PAD_L, RIGHT_GUTTER, type Hover, renderTickChart } from './tickChartRender';
import useOrderBookRef from './useOrderBookRef';
import useTickHistory from './useTickHistory';

type TickChartCanvasOptions = {
    exchange: ExchangeId;
    symbol: string;
    tickSize: number;
    visibility: SeriesVisibility;
};

type DragState = { pointerId: number; x: number };

const ZOOM_STEP = 0.85; // <1 zooms in (shorter window) on scroll up

const makeLiveView = (): TickView => ({ endT: Date.now(), follow: true, spanMs: SPAN_DEFAULT });

// Owns the tick chart's imperative canvas lifecycle: stream-backed refs, sizing,
// pointer/wheel interactions, and the RAF paint loop. The React component only
// renders panel controls and the canvas element.
const useTickChartCanvas = ({ exchange, symbol, tickSize, visibility }: TickChartCanvasOptions) => {
    const historyRef = useTickHistory(exchange, symbol);

    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sizeRef = useRef({ h: 0, w: 0 });
    const viewRef = useRef<TickView>(makeLiveView());
    const hoverRef = useRef<Hover>(null);
    const dragRef = useRef<DragState | null>(null);
    const dirtyRef = useRef(true);
    const tickSizeRef = useRef(tickSize);
    const visibilityRef = useRef(visibility);
    const centeredRef = useRef(false);

    const [live, setLive] = useState(true);
    const [centered, setCentered] = useState(false);

    tickSizeRef.current = tickSize;
    visibilityRef.current = visibility;
    centeredRef.current = centered;

    const markDirty = useCallback(() => {
        dirtyRef.current = true;
    }, []);

    // Latest order book in a ref; mark dirty on each update so the depth column
    // keeps repainting even when the view is paused.
    const bookRef = useOrderBookRef(exchange, symbol, markDirty);

    const goLive = useCallback(() => {
        viewRef.current = makeLiveView();
        setLive(true);
        markDirty();
    }, [markDirty]);

    const toggleCentered = useCallback(() => {
        setCentered((current) => {
            const next = !current;
            centeredRef.current = next;
            markDirty();
            return next;
        });
    }, [markDirty]);

    useEffect(markDirty, [centered, markDirty, tickSize, visibility]);

    // Reset the window whenever the market changes (history is rebuilt from scratch).
    useEffect(() => {
        viewRef.current = makeLiveView();
        hoverRef.current = null;
        dragRef.current = null;
        setLive(true);
        markDirty();
    }, [exchange, markDirty, symbol]);

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
            sizeRef.current = { h, w };
            canvas.width = Math.max(1, w * dpr);
            canvas.height = Math.max(1, h * dpr);
            markDirty();
        };

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(wrap);
        return () => ro.disconnect();
    }, [markDirty]);

    // Pointer/wheel interactions: wheel zooms (anchored at cursor when paused),
    // drag pans (freezes follow), double-click jumps back to live.
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;

        const plotWidth = () => {
            const bookW = visibilityRef.current.book ? BOOK_W : 0;
            return sizeRef.current.w - PAD_L - bookW - RIGHT_GUTTER;
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const v = viewRef.current;
            const newSpan = clampSpan(v.spanMs * (e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP));
            if (!v.follow) {
                const r = el.getBoundingClientRect();
                const plotW = plotWidth();
                const frac = plotW > 0 ? Math.min(1, Math.max(0, (e.clientX - r.left - PAD_L) / plotW)) : 1;
                const anchorT = v.endT - v.spanMs + frac * v.spanMs;
                v.endT = anchorT + (1 - frac) * newSpan;
            }
            v.spanMs = newSpan;
            markDirty();
        };

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return;
            dragRef.current = { pointerId: e.pointerId, x: e.clientX };
            el.setPointerCapture(e.pointerId);
        };

        const onPointerMove = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            hoverRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
            markDirty();

            const drag = dragRef.current;
            if (!drag) return;

            const dx = e.clientX - drag.x;
            drag.x = e.clientX;
            const v = viewRef.current;
            if (v.follow) {
                v.follow = false;
                setLive(false);
            }

            const plotW = plotWidth();
            if (plotW > 0) v.endT -= dx * (v.spanMs / plotW);
        };

        const endDrag = () => {
            const drag = dragRef.current;
            if (!drag) return;
            try {
                el.releasePointerCapture(drag.pointerId);
            } catch {
                // pointer already released
            }
            dragRef.current = null;
        };

        const onPointerLeave = () => {
            hoverRef.current = null;
            markDirty();
        };

        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', endDrag);
        el.addEventListener('pointercancel', endDrag);
        el.addEventListener('pointerleave', onPointerLeave);
        el.addEventListener('dblclick', goLive);
        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', endDrag);
            el.removeEventListener('pointercancel', endDrag);
            el.removeEventListener('pointerleave', onPointerLeave);
            el.removeEventListener('dblclick', goLive);
        };
    }, [goLive, markDirty]);

    // Render loop: advance the right edge while following, clamp to available data,
    // and repaint only when something changed.
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        let raf = 0;
        const draw = () => {
            raf = requestAnimationFrame(draw);
            const v = viewRef.current;
            const now = Date.now();
            if (v.follow) {
                v.endT = now;
                markDirty();
            }

            const history = historyRef.current;
            const firstT = history.points.length ? history.points[0].t : null;
            const clamped = clampView(v, firstT, now);
            if (clamped.follow !== v.follow) setLive(clamped.follow);
            v.endT = clamped.endT;
            v.follow = clamped.follow;

            if (!dirtyRef.current) return;
            dirtyRef.current = false;

            const { w, h } = sizeRef.current;
            if (w <= 0 || h <= 0) return;

            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            renderTickChart(
                ctx,
                history,
                v,
                { h, w },
                tickSizeRef.current,
                hoverRef.current,
                bookRef.current,
                centeredRef.current,
                visibilityRef.current,
            );
        };

        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [bookRef, historyRef, markDirty]);

    return { canvasRef, centered, goLive, live, toggleCentered, wrapRef };
};

export default useTickChartCanvas;
