// Canvas drawing for the tick chart. Pure rendering: every function takes the 2D
// context plus already-computed data/view and paints — no React, no DOM state.
// Three stacked regions share one time axis: price (bid/ask + trades), spread, volume.

import { format } from 'date-fns';

import { TERMINAL_FONT, palette, withAlpha } from '@/lib/theme';
import { formatNumber, formatPrice } from '@/utils/number';

import {
    type Range,
    type TickPoint,
    type TickView,
    type TradeMark,
    decimalsForRange,
    fmtSpan,
    lowerBoundT,
    maxVolume,
    niceTicks,
    priceRange,
    spreadRange,
} from './tickChartMath';

export type TickData = { points: TickPoint[]; trades: TradeMark[] };
export type Hover = { x: number; y: number } | null;

type Layout = {
    h: number;
    mainH: number;
    mainTop: number;
    padB: number;
    padL: number;
    padR: number;
    plotW: number;
    spreadH: number;
    spreadTop: number;
    volH: number;
    volTop: number;
    w: number;
};

export const RIGHT_GUTTER = 54; // value-axis labels live here
export const PAD_L = 6; // plot left inset
const BOTTOM = 16; // time-axis strip
const GAP = 10; // vertical gap between the three regions

const fontPx = (px: number) => `${px}px ${TERMINAL_FONT}`;

const fmtVol = (n: number) =>
    formatNumber(n, { maximumFractionDigits: 2, notation: n >= 1e4 ? 'compact' : 'standard' });

const TIME_STEPS = [1e3, 2e3, 5e3, 10e3, 15e3, 30e3, 60e3, 120e3, 300e3, 600e3, 900e3, 1.8e6, 3.6e6];
const pickTimeStep = (span: number) => TIME_STEPS.find((s) => span / s <= 8) ?? TIME_STEPS[TIME_STEPS.length - 1];

const computeLayout = (w: number, h: number): Layout => {
    const usableH = h - BOTTOM - GAP * 2;
    const mainH = usableH * 0.62;
    const spreadH = usableH * 0.19;
    const volH = usableH * 0.19;
    const mainTop = 0;
    const spreadTop = mainTop + mainH + GAP;
    const volTop = spreadTop + spreadH + GAP;
    return {
        h,
        mainH,
        mainTop,
        padB: BOTTOM,
        padL: PAD_L,
        padR: RIGHT_GUTTER,
        plotW: w - PAD_L - RIGHT_GUTTER,
        spreadH,
        spreadTop,
        volH,
        volTop,
        w,
    };
};

type ValueFn = (p: TickPoint) => number;
type Scale = (v: number) => number;

// Step-after line: a value holds until the next change, then jumps. The final
// value is extended to the right edge ("now"). The point straddling the left edge
// is clamped to the plot's left so its value fills the window start.
const strokeStep = (
    ctx: CanvasRenderingContext2D,
    points: TickPoint[],
    value: ValueFn,
    yFor: Scale,
    xFor: Scale,
    x0: number,
    startT: number,
    endT: number,
    color: string,
    lineWidth: number,
) => {
    ctx.beginPath();
    let started = false;
    let lastY = 0;
    for (let i = Math.max(0, lowerBoundT(points, startT) - 1); i < points.length; i++) {
        const p = points[i];
        if (p.t > endT) break;
        const x = Math.max(x0, xFor(p.t));
        const y = yFor(value(p));
        if (!started) {
            ctx.moveTo(x, y);
            started = true;
        } else {
            ctx.lineTo(x, lastY);
            ctx.lineTo(x, y);
        }
        lastY = y;
    }
    if (started) ctx.lineTo(xFor(endT), lastY);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
};

// Bid and ask change at the same points, so each inter-point segment is a flat
// rectangle between the two lines — the visible spread, filled faintly.
const fillSpreadBand = (
    ctx: CanvasRenderingContext2D,
    points: TickPoint[],
    yFor: Scale,
    xFor: Scale,
    x0: number,
    startT: number,
    endT: number,
    color: string,
) => {
    ctx.fillStyle = color;
    for (let i = Math.max(0, lowerBoundT(points, startT) - 1); i < points.length; i++) {
        const p = points[i];
        if (p.t > endT) break;
        const next = points[i + 1];
        const xL = Math.max(x0, xFor(p.t));
        const xR = next && next.t <= endT ? xFor(next.t) : xFor(endT);
        if (xR > xL) ctx.fillRect(xL, yFor(p.ask), xR - xL, yFor(p.bid) - yFor(p.ask));
        if (!next || next.t > endT) break;
    }
};

const drawAxisLabel = (ctx: CanvasRenderingContext2D, L: Layout, y: number, text: string, color: string) => {
    ctx.font = fontPx(9);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, L.w - L.padR + 4, y);
};

// Filled chip in the right gutter — used for current bid/ask and the crosshair readout.
const drawTag = (
    ctx: CanvasRenderingContext2D,
    L: Layout,
    y: number,
    text: string,
    bg: string,
    fg: string = palette.bg,
) => {
    ctx.font = fontPx(9);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = bg;
    ctx.fillRect(L.w - L.padR, y - 7, L.padR - 1, 14);
    ctx.fillStyle = fg;
    ctx.fillText(text, L.w - L.padR + 4, y);
};

const drawFrame = (ctx: CanvasRenderingContext2D, L: Layout) => {
    ctx.lineWidth = 1;
    const xR = L.w - L.padR + 0.5;
    ctx.strokeStyle = palette.bd;
    ctx.beginPath();
    ctx.moveTo(xR, L.mainTop);
    ctx.lineTo(xR, L.volTop + L.volH);
    ctx.stroke();
    // Brighter dividers so the three regions read as distinct panels.
    ctx.strokeStyle = palette.bdHi;
    for (const yy of [L.spreadTop - GAP / 2, L.volTop - GAP / 2]) {
        const y = Math.round(yy) + 0.5;
        ctx.beginPath();
        ctx.moveTo(L.padL, y);
        ctx.lineTo(L.w - L.padR, y);
        ctx.stroke();
    }
};

type LegendSeg = { color: string; text: string };

// Top-left caption for each sub-chart, with the values at the hovered time shown
// next to it (bid/ask, spread, and the nearest trade's volume). Without a hover
// only the captions render — the live values already sit on the right-edge tags.
const drawLegend = (
    ctx: CanvasRenderingContext2D,
    L: Layout,
    data: TickData,
    view: TickView,
    startT: number,
    hover: Hover,
    tickSize: number,
    pr: Range | null,
    sr: Range | null,
) => {
    const plotRight = L.w - L.padR;
    let point: TickPoint | null = null;
    let trade: TradeMark | null = null;
    if (hover && hover.x >= L.padL && hover.x <= plotRight) {
        const t = startT + ((hover.x - L.padL) / L.plotW) * view.spanMs;
        point = data.points[Math.max(0, lowerBoundT(data.points, t) - 1)] ?? null;
        const j = lowerBoundT(data.trades, t);
        const before = data.trades[j - 1];
        const after = data.trades[j];
        trade = before && after ? (t - before.t <= after.t - t ? before : after) : (after ?? before ?? null);
    }

    const priceDec = decimalsForRange(pr ? pr.hi - pr.lo : 1, tickSize);
    const spreadDec = decimalsForRange(sr ? sr.hi : 1, tickSize) + 1;

    const row = (top: number, caption: string, values: LegendSeg[]) => {
        const segs: LegendSeg[] = [{ color: palette.fgDim, text: caption }, ...values];
        ctx.font = fontPx(10);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        let width = 0;
        for (const s of segs) width += ctx.measureText(s.text).width + 8;
        ctx.fillStyle = withAlpha(palette.bg, 0.55);
        ctx.fillRect(L.padL + 1, top + 1, width, 15);
        let x = L.padL + 3;
        for (const s of segs) {
            ctx.fillStyle = s.color;
            ctx.fillText(s.text, x, top + 3);
            x += ctx.measureText(s.text).width + 8;
        }
    };

    row(L.mainTop, 'TICKS', [
        { color: palette.fgDim, text: fmtSpan(view.spanMs) },
        ...(point
            ? [
                  { color: palette.up, text: `bid ${formatPrice(point.bid, priceDec)}` },
                  { color: palette.down, text: `ask ${formatPrice(point.ask, priceDec)}` },
              ]
            : []),
    ]);
    row(
        L.spreadTop,
        'SPREAD',
        point ? [{ color: palette.heatLo, text: formatPrice(point.ask - point.bid, spreadDec) }] : [],
    );
    row(
        L.volTop,
        'VOLUME',
        trade ? [{ color: trade.buy ? palette.up : palette.down, text: fmtVol(trade.size * trade.price) }] : [],
    );
};

const drawTimeGrid = (ctx: CanvasRenderingContext2D, L: Layout, startT: number, endT: number, xFor: Scale) => {
    const step = pickTimeStep(endT - startT);
    const bottom = L.volTop + L.volH;
    ctx.font = fontPx(9);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let t = Math.ceil(startT / step) * step; t <= endT; t += step) {
        const x = xFor(t);
        if (x < L.padL || x > L.w - L.padR) continue;
        ctx.strokeStyle = palette.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 0.5, L.mainTop);
        ctx.lineTo(x + 0.5, bottom);
        ctx.stroke();
        ctx.fillStyle = palette.fgDim;
        ctx.fillText(format(t, 'HH:mm:ss'), x, bottom + 4);
    }
};

const drawMain = (
    ctx: CanvasRenderingContext2D,
    L: Layout,
    data: TickData,
    startT: number,
    endT: number,
    xFor: Scale,
    tickSize: number,
    pr: Range | null,
) => {
    if (!pr) return;
    const span = pr.hi - pr.lo || 1;
    const yFor: Scale = (v) => L.mainTop + (1 - (v - pr.lo) / span) * L.mainH;
    const dec = decimalsForRange(span, tickSize);
    const clampY = (y: number) => Math.max(L.mainTop + 7, Math.min(L.mainTop + L.mainH - 7, y));

    for (const tick of niceTicks(pr.lo, pr.hi)) {
        const y = yFor(tick);
        ctx.strokeStyle = palette.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L.padL, y + 0.5);
        ctx.lineTo(L.w - L.padR, y + 0.5);
        ctx.stroke();
        drawAxisLabel(ctx, L, y, formatPrice(tick, dec), palette.fgDim);
    }

    fillSpreadBand(ctx, data.points, yFor, xFor, L.padL, startT, endT, withAlpha(palette.ac, 0.05));
    strokeStep(ctx, data.points, (p) => p.bid, yFor, xFor, L.padL, startT, endT, palette.up, 1.25);
    strokeStep(ctx, data.points, (p) => p.ask, yFor, xFor, L.padL, startT, endT, palette.down, 1.25);

    ctx.fillStyle = palette.ac;
    ctx.strokeStyle = palette.bg;
    ctx.lineWidth = 0.5;
    for (let i = lowerBoundT(data.trades, startT); i < data.trades.length; i++) {
        const tr = data.trades[i];
        if (tr.t > endT) break;
        const y = yFor(tr.price);
        if (y < L.mainTop || y > L.mainTop + L.mainH) continue;
        ctx.beginPath();
        ctx.arc(xFor(tr.t), y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    const cur = data.points[data.points.length - 1];
    if (cur) {
        drawTag(ctx, L, clampY(yFor(cur.ask)), formatPrice(cur.ask, dec), palette.down);
        drawTag(ctx, L, clampY(yFor(cur.bid)), formatPrice(cur.bid, dec), palette.up);
    }
};

const drawSpread = (
    ctx: CanvasRenderingContext2D,
    L: Layout,
    data: TickData,
    startT: number,
    endT: number,
    xFor: Scale,
    tickSize: number,
    sr: Range | null,
) => {
    if (!sr) return;
    const span = sr.hi - sr.lo || 1;
    const yFor: Scale = (v) => L.spreadTop + (1 - (v - sr.lo) / span) * L.spreadH;
    const dec = decimalsForRange(sr.hi, tickSize) + 1;

    strokeStep(ctx, data.points, (p) => p.ask - p.bid, yFor, xFor, L.padL, startT, endT, palette.heatLo, 1.1);

    drawAxisLabel(ctx, L, L.spreadTop + 6, formatPrice(sr.hi, dec), palette.fgDim);
    const cur = data.points[data.points.length - 1];
    if (cur) {
        const v = cur.ask - cur.bid;
        const y = Math.max(L.spreadTop + 7, Math.min(L.spreadTop + L.spreadH - 7, yFor(v)));
        drawTag(ctx, L, y, formatPrice(v, dec), palette.heatLo);
    }
};

const drawVolume = (
    ctx: CanvasRenderingContext2D,
    L: Layout,
    data: TickData,
    startT: number,
    endT: number,
    xFor: Scale,
) => {
    const mv = maxVolume(data.trades, startT, endT);
    if (mv <= 0) return;
    const baseY = L.volTop + L.volH;
    for (let i = lowerBoundT(data.trades, startT); i < data.trades.length; i++) {
        const tr = data.trades[i];
        if (tr.t > endT) break;
        ctx.fillStyle = tr.buy ? palette.up : palette.down;
        const usd = tr.size * tr.price;
        ctx.fillRect(xFor(tr.t) - 0.75, baseY - (usd / mv) * L.volH, 1.5, (usd / mv) * L.volH);
    }
    drawAxisLabel(ctx, L, L.volTop + 6, fmtVol(mv), palette.fgDim);
};

const drawCrosshair = (
    ctx: CanvasRenderingContext2D,
    L: Layout,
    view: TickView,
    startT: number,
    hover: { x: number; y: number },
    tickSize: number,
    pr: Range | null,
) => {
    const plotRight = L.w - L.padR;
    const plotBottom = L.volTop + L.volH;
    const { x, y } = hover;
    if (x < L.padL || x > plotRight || y < L.mainTop || y > plotBottom) return;

    ctx.save();
    ctx.strokeStyle = withAlpha(palette.fg, 0.4);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(x + 0.5, L.mainTop);
    ctx.lineTo(x + 0.5, plotBottom);
    ctx.stroke();
    const inMain = y <= L.mainTop + L.mainH;
    if (inMain) {
        ctx.beginPath();
        ctx.moveTo(L.padL, y + 0.5);
        ctx.lineTo(plotRight, y + 0.5);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    const t = startT + ((x - L.padL) / (plotRight - L.padL)) * view.spanMs;
    const label = format(t, 'HH:mm:ss');
    ctx.font = fontPx(9);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const tw = ctx.measureText(label).width + 8;
    const bx = Math.max(L.padL, Math.min(plotRight - tw, x - tw / 2));
    ctx.fillStyle = palette.bgAlt;
    ctx.fillRect(bx, plotBottom + 2, tw, 13);
    ctx.fillStyle = palette.fg;
    ctx.fillText(label, bx + tw / 2, plotBottom + 4);

    if (inMain) {
        if (pr) {
            const span = pr.hi - pr.lo || 1;
            const price = pr.lo + (1 - (y - L.mainTop) / L.mainH) * span;
            drawTag(ctx, L, y, formatPrice(price, decimalsForRange(span, tickSize)), palette.bdHi, palette.fg);
        }
    }
    ctx.restore();
};

export const renderTickChart = (
    ctx: CanvasRenderingContext2D,
    data: TickData,
    view: TickView,
    size: { w: number; h: number },
    tickSize: number,
    hover: Hover,
) => {
    const L = computeLayout(size.w, size.h);
    ctx.clearRect(0, 0, size.w, size.h);
    if (L.plotW <= 0 || L.mainH <= 0) return;

    const startT = view.endT - view.spanMs;
    const endT = view.endT;
    const xFor: Scale = (t) => L.padL + ((t - startT) / view.spanMs) * L.plotW;

    drawFrame(ctx, L);

    if (data.points.length === 0) {
        ctx.font = fontPx(11);
        ctx.fillStyle = palette.fgDim;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('waiting for data…', L.padL + L.plotW / 2, L.mainTop + L.mainH / 2);
        return;
    }

    // Computed once per frame and threaded through; the price/spread sub-charts,
    // the legend and the crosshair all read the same ranges.
    const pr = priceRange(data.points, data.trades, startT, endT);
    const sr = spreadRange(data.points, startT, endT);

    drawTimeGrid(ctx, L, startT, endT, xFor);
    drawMain(ctx, L, data, startT, endT, xFor, tickSize, pr);
    drawSpread(ctx, L, data, startT, endT, xFor, tickSize, sr);
    drawVolume(ctx, L, data, startT, endT, xFor);
    drawLegend(ctx, L, data, view, startT, hover, tickSize, pr, sr);
    if (hover) drawCrosshair(ctx, L, view, startT, hover, tickSize, pr);
};
