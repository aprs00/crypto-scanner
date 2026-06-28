import { useEffect, useRef, useState } from 'react';

import CSPanel from '@/components/Layouts/CSPanel';
import IconButton from '@/components/UI/CSIconButton';
import CSToggleButton from '@/components/UI/CSToggleButton';

import { SPAN_DEFAULT, type TickView, clampSpan, clampView } from '../tickChartMath';
import { PAD_L, RIGHT_GUTTER, type Hover, renderTickChart } from '../tickChartRender';
import { PanelType } from '../types';
import useResolvedSource from '../useResolvedSource';
import useTickHistory from '../useTickHistory';
import PanelSource from './PanelSource';
import styles from './TickChart.module.css';

type Props = { panelId: string; onRemove: () => void };

const ZOOM_STEP = 0.85; // <1 zooms in (shorter window) on scroll up

const TickChart = ({ panelId, onRemove }: Props) => {
    const { exchange, symbol, tickSize } = useResolvedSource(panelId, PanelType.Tick);
    const historyRef = useTickHistory(exchange, symbol);

    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sizeRef = useRef({ h: 0, w: 0 });
    const viewRef = useRef<TickView>({ endT: Date.now(), follow: true, spanMs: SPAN_DEFAULT });
    const hoverRef = useRef<Hover>(null);
    const dragRef = useRef<{ pointerId: number; x: number } | null>(null);
    const dirtyRef = useRef(true);
    const tickSizeRef = useRef(tickSize);
    tickSizeRef.current = tickSize;

    const [live, setLive] = useState(true);

    const goLive = () => {
        viewRef.current = { endT: Date.now(), follow: true, spanMs: SPAN_DEFAULT };
        setLive(true);
        dirtyRef.current = true;
    };

    // Reset the window whenever the market changes (history is rebuilt from scratch).
    useEffect(() => {
        viewRef.current = { endT: Date.now(), follow: true, spanMs: SPAN_DEFAULT };
        hoverRef.current = null;
        setLive(true);
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
            sizeRef.current = { h, w };
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.max(1, w * dpr);
            canvas.height = Math.max(1, h * dpr);
            dirtyRef.current = true;
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(wrap);
        return () => ro.disconnect();
    }, []);

    // Pointer/wheel interactions: wheel zooms (anchored at cursor when paused),
    // drag pans (freezes follow), double-click jumps back to live.
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const v = viewRef.current;
            const newSpan = clampSpan(v.spanMs * (e.deltaY > 0 ? 1 / ZOOM_STEP : ZOOM_STEP));
            if (!v.follow) {
                const r = el.getBoundingClientRect();
                const plotW = sizeRef.current.w - PAD_L - RIGHT_GUTTER;
                const frac = plotW > 0 ? Math.min(1, Math.max(0, (e.clientX - r.left - PAD_L) / plotW)) : 1;
                const anchorT = v.endT - v.spanMs + frac * v.spanMs;
                v.endT = anchorT + (1 - frac) * newSpan;
            }
            v.spanMs = newSpan;
            dirtyRef.current = true;
        };

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return;
            dragRef.current = { pointerId: e.pointerId, x: e.clientX };
            el.setPointerCapture(e.pointerId);
        };

        const onPointerMove = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            hoverRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
            dirtyRef.current = true;
            const drag = dragRef.current;
            if (!drag) return;
            const dx = e.clientX - drag.x;
            drag.x = e.clientX;
            const v = viewRef.current;
            if (v.follow) {
                v.follow = false;
                setLive(false);
            }
            const plotW = sizeRef.current.w - PAD_L - RIGHT_GUTTER;
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
            dirtyRef.current = true;
        };

        const onDblClick = () => goLive();

        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', endDrag);
        el.addEventListener('pointercancel', endDrag);
        el.addEventListener('pointerleave', onPointerLeave);
        el.addEventListener('dblclick', onDblClick);
        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('pointerdown', onPointerDown);
            el.removeEventListener('pointermove', onPointerMove);
            el.removeEventListener('pointerup', endDrag);
            el.removeEventListener('pointercancel', endDrag);
            el.removeEventListener('pointerleave', onPointerLeave);
            el.removeEventListener('dblclick', onDblClick);
        };
    }, []);

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
                dirtyRef.current = true;
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
            renderTickChart(ctx, history, v, { h, w }, tickSizeRef.current, hoverRef.current);
        };
        raf = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(raf);
    }, [historyRef]);

    return (
        <CSPanel
            className="h-full"
            controls={
                <span className={styles.controls}>
                    <PanelSource panelId={panelId} panelType={PanelType.Tick} />
                    <CSToggleButton active={live} onClick={goLive}>
                        ● LIVE
                    </CSToggleButton>
                    <IconButton label="-" onClick={onRemove} />
                </span>
            }
        >
            <div className={`${styles.body} cs-no-drag`} ref={wrapRef}>
                <canvas className={styles.canvas} ref={canvasRef} />
            </div>
        </CSPanel>
    );
};

export default TickChart;
