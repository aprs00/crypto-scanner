import { useEffect, useRef, useState } from 'react';

import CSPanel from '@/components/Layouts/CSPanel';
import CSButton from '@/components/UI/CSButton';
import CSSegmented from '@/components/UI/CSSegmented';
import { palette, withAlpha } from '@/lib/theme';
import { useOrderBook } from '@/services/exchanges/hooks';

import { Orientation, PanelType } from '../types';
import useResolvedSource from '../useResolvedSource';
import styles from './DepthChart.module.css';
import PanelSource from './PanelSource';

const PAD_MAIN_START = 10;
const PAD_MAIN_END_H = 18;
const PAD_MAIN_END_V = 40;
const PAD_CROSS = 10;
// Zoom is now expressed as ± a fraction of mid price (e.g. 0.005 = ±0.5%).
// Previously it was a fraction of the visible ladder extent, which collapsed to
// sub-tick on exchanges that publish a shallow book (e.g. Hyperliquid's 20-level l2Book).
const ZOOM_MIN = 0.0001;
const ZOOM_MAX = 0.1;
const ZOOM_STEP = 0.85;
const ZOOM_DEFAULT = 0.005;

const ORIENTATIONS = Object.values(Orientation);

type Props = { panelId: string; onRemove: () => void };

const DepthChart = ({ panelId, onRemove }: Props) => {
    const { exchange, symbol } = useResolvedSource(panelId, PanelType.Depth);
    const orderBook = useOrderBook(exchange, symbol);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ w: 300, h: 160 });
    const [zoom, setZoom] = useState(ZOOM_DEFAULT);
    const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
    const [orientation, setOrientation] = useState<Orientation>(Orientation.H);

    useEffect(() => {
        if (!wrapRef.current) return;
        const measure = () => {
            if (!wrapRef.current) return;
            const r = wrapRef.current.getBoundingClientRect();
            setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(wrapRef.current);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            setZoom((z) => {
                const next = e.deltaY > 0 ? z / ZOOM_STEP : z * ZOOM_STEP;
                return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, next));
            });
        };
        el.addEventListener('wheel', onWheel, { passive: false });

        const onMove = (e: MouseEvent) => {
            const r = el.getBoundingClientRect();
            setHover({ x: e.clientX - r.left, y: e.clientY - r.top });
        };
        const onLeave = () => setHover(null);
        el.addEventListener('mousemove', onMove);
        el.addEventListener('mouseleave', onLeave);

        return () => {
            el.removeEventListener('wheel', onWheel);
            el.removeEventListener('mousemove', onMove);
            el.removeEventListener('mouseleave', onLeave);
        };
    }, []);

    useEffect(() => {
        const c = canvasRef.current;
        if (!c) return;
        const dpr = window.devicePixelRatio || 1;
        c.width = size.w * dpr;
        c.height = size.h * dpr;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, size.w, size.h);

        const allBids = orderBook.bids;
        const allAsks = orderBook.asks;
        if (!allBids.length || !allAsks.length) return;

        const bestBid = allBids[0][0];
        const bestAsk = allAsks[0][0];
        const mid = (bestBid + bestAsk) / 2;

        const viewRange = mid * zoom;

        const bidCum: { price: number; cum: number }[] = [];
        const askCum: { price: number; cum: number }[] = [];
        let bSum = 0;
        for (const [price, q] of allBids) {
            if (mid - price > viewRange) break;
            bSum += q;
            bidCum.push({ price, cum: bSum });
        }
        let aSum = 0;
        for (const [price, q] of allAsks) {
            if (price - mid > viewRange) break;
            aSum += q;
            askCum.push({ price, cum: aSum });
        }
        if (!bidCum.length || !askCum.length) return;

        const maxCum = Math.max(bSum, aSum) || 1;
        const lowPrice = mid - viewRange;
        const highPrice = mid + viewRange;

        const monoFont = `9px 'JetBrains Mono', ui-monospace, monospace`;
        const decimals = Math.max(0, Math.min(4, Math.ceil(-Math.log10(viewRange / 4))));
        const fmt = (n: number) => n.toFixed(decimals);

        if (orientation === Orientation.H) {
            const W = size.w - PAD_CROSS * 2;
            const H = size.h - PAD_MAIN_START - PAD_MAIN_END_H;
            if (W <= 0 || H <= 0) return;

            const xMid = PAD_CROSS + W / 2;
            const yBottom = PAD_MAIN_START + H;
            const halfW = W / 2;

            const xForBid = (price: number) => xMid - ((mid - price) / viewRange) * halfW;
            const xForAsk = (price: number) => xMid + ((price - mid) / viewRange) * halfW;
            const yFor = (cum: number) => yBottom - (cum / maxCum) * H;

            const drawSide = (
                data: { price: number; cum: number }[],
                color: string,
                xFn: (p: number) => number,
                edgeX: number,
            ) => {
                const lastCum = data[data.length - 1].cum;

                ctx.beginPath();
                ctx.moveTo(xMid, yBottom);
                ctx.lineTo(xMid, yFor(data[0].cum));
                for (const d of data) ctx.lineTo(xFn(d.price), yFor(d.cum));
                ctx.lineTo(edgeX, yFor(lastCum));
                ctx.lineTo(edgeX, yBottom);
                ctx.closePath();
                ctx.fillStyle = withAlpha(color, 0.18);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(xMid, yFor(data[0].cum));
                for (const d of data) ctx.lineTo(xFn(d.price), yFor(d.cum));
                ctx.lineTo(edgeX, yFor(lastCum));
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.25;
                ctx.stroke();
            };

            drawSide(bidCum, palette.up, xForBid, PAD_CROSS);
            drawSide(askCum, palette.down, xForAsk, PAD_CROSS + W);

            ctx.strokeStyle = palette.ac;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(xMid, PAD_MAIN_START);
            ctx.lineTo(xMid, yBottom);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = monoFont;
            ctx.textBaseline = 'top';
            ctx.fillStyle = palette.fgDim;
            ctx.textAlign = 'left';
            ctx.fillText(fmt(lowPrice), PAD_CROSS, yBottom + 4);
            ctx.textAlign = 'right';
            ctx.fillText(fmt(highPrice), PAD_CROSS + W, yBottom + 4);
            ctx.textAlign = 'center';
            ctx.fillStyle = palette.ac;
            ctx.fillText(fmt(mid), xMid, yBottom + 4);

            if (hover) {
                const hx = hover.x;
                const hy = hover.y;
                const inX = hx >= PAD_CROSS && hx <= PAD_CROSS + W;
                const inY = hy >= PAD_MAIN_START && hy <= yBottom;
                if (inX && inY) {
                    const isBidSide = hx <= xMid;
                    const price = isBidSide
                        ? mid - ((xMid - hx) / halfW) * viewRange
                        : mid + ((hx - xMid) / halfW) * viewRange;

                    ctx.strokeStyle = withAlpha(palette.fg, 0.45);
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 3]);
                    ctx.beginPath();
                    ctx.moveTo(hx + 0.5, PAD_MAIN_START);
                    ctx.lineTo(hx + 0.5, yBottom);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    const sideColor = isBidSide ? palette.up : palette.down;
                    const priceText = fmt(price);

                    ctx.font = `bold 10px 'JetBrains Mono', ui-monospace, monospace`;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';
                    const priceW = ctx.measureText(priceText).width + 8;
                    let priceBoxX = hx - priceW / 2;
                    if (priceBoxX < PAD_CROSS) priceBoxX = PAD_CROSS;
                    if (priceBoxX + priceW > PAD_CROSS + W) priceBoxX = PAD_CROSS + W - priceW;
                    ctx.fillStyle = sideColor;
                    ctx.fillRect(priceBoxX, yBottom + 1, priceW, 14);
                    ctx.fillStyle = palette.bg;
                    ctx.fillText(priceText, priceBoxX + 4, yBottom + 8);
                }
            }
        } else {
            // Vertical: price on Y axis (asks top, bids bottom), cumulative on X axis (extends right from left edge).
            const W = size.w - PAD_MAIN_START - PAD_MAIN_END_V;
            const H = size.h - PAD_CROSS * 2;
            if (W <= 0 || H <= 0) return;

            const yMid = PAD_CROSS + H / 2;
            const xLeft = PAD_MAIN_START;
            const halfH = H / 2;

            const yForAsk = (price: number) => yMid - ((price - mid) / viewRange) * halfH;
            const yForBid = (price: number) => yMid + ((mid - price) / viewRange) * halfH;
            const xFor = (cum: number) => xLeft + (cum / maxCum) * W;

            const drawSide = (
                data: { price: number; cum: number }[],
                color: string,
                yFn: (p: number) => number,
                edgeY: number,
            ) => {
                const lastCum = data[data.length - 1].cum;

                ctx.beginPath();
                ctx.moveTo(xLeft, yMid);
                ctx.lineTo(xFor(data[0].cum), yMid);
                for (const d of data) ctx.lineTo(xFor(d.cum), yFn(d.price));
                ctx.lineTo(xFor(lastCum), edgeY);
                ctx.lineTo(xLeft, edgeY);
                ctx.closePath();
                ctx.fillStyle = withAlpha(color, 0.18);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(xFor(data[0].cum), yMid);
                for (const d of data) ctx.lineTo(xFor(d.cum), yFn(d.price));
                ctx.lineTo(xFor(lastCum), edgeY);
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.25;
                ctx.stroke();
            };

            drawSide(askCum, palette.down, yForAsk, PAD_CROSS);
            drawSide(bidCum, palette.up, yForBid, PAD_CROSS + H);

            ctx.strokeStyle = palette.ac;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(xLeft, yMid);
            ctx.lineTo(xLeft + W, yMid);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.font = monoFont;
            ctx.fillStyle = palette.fgDim;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            const labelX = xLeft + W + 4;
            ctx.fillText(fmt(highPrice), labelX, PAD_CROSS + 4);
            ctx.fillText(fmt(lowPrice), labelX, PAD_CROSS + H - 4);
            ctx.fillStyle = palette.ac;
            ctx.fillText(fmt(mid), labelX, yMid);

            if (hover) {
                const hx = hover.x;
                const hy = hover.y;
                const inX = hx >= xLeft && hx <= xLeft + W;
                const inY = hy >= PAD_CROSS && hy <= PAD_CROSS + H;
                if (inX && inY) {
                    const isAskSide = hy <= yMid;
                    const price = isAskSide
                        ? mid + ((yMid - hy) / halfH) * viewRange
                        : mid - ((hy - yMid) / halfH) * viewRange;

                    ctx.strokeStyle = withAlpha(palette.fg, 0.45);
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 3]);
                    ctx.beginPath();
                    ctx.moveTo(xLeft, hy + 0.5);
                    ctx.lineTo(xLeft + W, hy + 0.5);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    const sideColor = isAskSide ? palette.down : palette.up;
                    const priceText = fmt(price);

                    ctx.font = `bold 10px 'JetBrains Mono', ui-monospace, monospace`;
                    ctx.textBaseline = 'middle';
                    ctx.textAlign = 'left';
                    const priceW = ctx.measureText(priceText).width + 8;
                    const boxH = 14;
                    let boxY = hy - boxH / 2;
                    if (boxY < PAD_CROSS) boxY = PAD_CROSS;
                    if (boxY + boxH > PAD_CROSS + H) boxY = PAD_CROSS + H - boxH;
                    ctx.fillStyle = sideColor;
                    ctx.fillRect(xLeft + W + 1, boxY, priceW, boxH);
                    ctx.fillStyle = palette.bg;
                    ctx.fillText(priceText, xLeft + W + 5, boxY + boxH / 2);
                }
            }
        }
    }, [size, orderBook, zoom, hover, orientation]);

    const rangePct = zoom * 100;
    const rangeLabel = (rangePct < 1 && rangePct.toFixed(2)) || rangePct.toFixed(1);

    return (
        <CSPanel
            className="h-full"
            controls={
                <>
                    <PanelSource panelId={panelId} panelType={PanelType.Depth} />
                    <span className={styles.controls}>
                        <span className={styles.zoom}>±{rangeLabel}%</span>
                        <CSSegmented onChange={setOrientation} options={ORIENTATIONS} value={orientation} />
                    </span>
                    <CSButton onClick={onRemove} square>
                        -
                    </CSButton>
                </>
            }
        >
            <div className={styles.body} ref={wrapRef}>
                <canvas className={styles.canvas} ref={canvasRef} />
            </div>
        </CSPanel>
    );
};

export default DepthChart;
