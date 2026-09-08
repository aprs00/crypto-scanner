// Canvas drawing for the tick chart. Pure rendering: every function takes the 2D
// context plus already-computed data/view and paints — no React, no DOM state.
// Up to three stacked regions share one time axis: price (bid/ask + trades), spread,
// volume. The always-on price band also hosts the order-book depth column; spread,
// volume and the book each toggle off via SeriesVisibility and the layout reflows.

import { format } from 'date-fns';

import type { DepthState } from '@/services/exchanges/types';

import { TERMINAL_FONT, palette, withAlpha } from '@/lib/theme';
import { groupOrders } from '@/services/exchanges/orderBookGrouping';
import { DepthFeedStatus } from '@/services/exchanges/types';
import { formatNumber, formatPrice } from '@/utils/number';

import type { LocalOrderBook, OrderBookLevel, SeriesVisibility } from '../shared/settings/types';
import type { LiquidityPreferences } from '../shared/settings/useChartSeriesStore';
import type { LiquidityTimeline } from './liquidityModel';

import {
    type LiquidityViewport,
    type LiquidityRenderCache,
    drawLiquidity,
    drawLiquidityTooltip,
} from './liquidityRender';
import {
    type PriceView,
    type Range,
    type TickPoint,
    type TickView,
    type TradeMark,
    type TickWindow,
    PriceViewMode,
    decimalsForRange,
    fmtSpan,
    niceBucket,
    niceTicks,
    normalizeSpread,
    priceRangeAround,
    priceRangeFromExtent,
    tickWindow,
    upperBoundT,
} from './tickChartMath';

export type TickData = { points: TickPoint[]; trades: TradeMark[] };
export type Hover = { x: number; y: number } | null;

export type TickChartInteractionFrame = {
    axisLeft: number;
    bottomY: number;
    mainBottom: number;
    mainTop: number;
    plotLeft: number;
    plotRight: number;
    priceBodyRight: number;
    priceRange: Range | null;
    width: number;
};

type Layout = {
    axisLeft: number;
    bookLeft: number;
    bottomY: number;
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

type RenderFrame = {
    data: TickData;
    depthStatus: DepthState['status'];
    endT: number;
    follow: boolean;
    L: Layout;
    liquidityStatus: DepthState['status'];
    priceDec: number;
    priceMode: PriceView['mode'];
    priceRange: Range | null;
    spanMs: number;
    spreadDec: number;
    spreadRange: Range | null;
    startT: number;
    tickSize: number;
    visible: SeriesVisibility;
    window: TickWindow;
    xFor: Scale;
};

export const RIGHT_GUTTER = 54; // value-axis labels live here
export const BOOK_W = 64; // order-book depth column, between the plot and the axis gutter
export const PAD_L = 6; // plot left inset
const BOTTOM = 16; // time-axis strip
const GAP = 10; // vertical gap between the three regions
const BOOK_ROW_PX = 3; // target order-book row height; drives adaptive grouping

const fontPx = (px: number) => `${px}px ${TERMINAL_FONT}`;

const fmtVol = (n: number) =>
    formatNumber(n, { maximumFractionDigits: 2, notation: n >= 1e4 ? 'compact' : 'standard' });

const TIME_STEPS = [1e3, 2e3, 5e3, 10e3, 15e3, 30e3, 60e3, 120e3, 300e3, 600e3, 900e3, 1.8e6, 3.6e6];
const pickTimeStep = (span: number) => TIME_STEPS.find((s) => span / s <= 8) ?? TIME_STEPS[TIME_STEPS.length - 1];

// Base height weights for the stacked regions; only the visible ones share usableH.
const MAIN_WEIGHT = 0.62;
const SPREAD_WEIGHT = 0.19;
const VOL_WEIGHT = 0.19;

const computeLayout = (w: number, h: number, visible: SeriesVisibility): Layout => {
    const bookW = visible.book ? BOOK_W : 0;

    // Sum only the visible region weights; one GAP precedes each sub-region after main.
    let totalWeight = MAIN_WEIGHT;
    let gaps = 0;
    if (visible.spread) {
        totalWeight += SPREAD_WEIGHT;
        gaps++;
    }
    if (visible.volume) {
        totalWeight += VOL_WEIGHT;
        gaps++;
    }

    const usableH = h - BOTTOM - GAP * gaps;
    const mainH = usableH * (MAIN_WEIGHT / totalWeight);
    const spreadH = visible.spread ? usableH * (SPREAD_WEIGHT / totalWeight) : 0;
    const volH = visible.volume ? usableH * (VOL_WEIGHT / totalWeight) : 0;

    // Stack the visible regions top-down; a hidden one keeps a placeholder top but
    // zero height and is never drawn, so bottomY tracks the lowest visible region.
    const mainTop = 0;
    let cursor = mainTop + mainH;
    let spreadTop = cursor + GAP;
    if (visible.spread) {
        cursor += GAP;
        spreadTop = cursor;
        cursor += spreadH;
    }
    let volTop = cursor + GAP;
    if (visible.volume) {
        cursor += GAP;
        volTop = cursor;
        cursor += volH;
    }

    return {
        axisLeft: w - RIGHT_GUTTER,
        bookLeft: w - RIGHT_GUTTER - bookW,
        bottomY: cursor,
        h,
        mainH,
        mainTop,
        padB: BOTTOM,
        padL: PAD_L,
        padR: bookW + RIGHT_GUTTER,
        plotW: w - PAD_L - bookW - RIGHT_GUTTER,
        spreadH,
        spreadTop,
        volH,
        volTop,
        w,
    };
};

type ValueFn = (p: TickPoint) => number;
type Scale = (v: number) => number;

const makeFrame = (
    L: Layout,
    data: TickData,
    view: TickView,
    tickSize: number,
    priceView: PriceView,
    visible: SeriesVisibility,
    depth: DepthState,
    liquidity: LiquidityTimeline,
): RenderFrame => {
    const startT = view.endT - view.spanMs;
    const endT = view.endT;
    const window = tickWindow(data.points, data.trades, startT, endT, tickSize);
    let priceRangeForFrame = window.priceRange;
    const latestVisiblePoint = data.points[window.pointEnd - 1];
    let fallbackMidpoint: number | null = null;

    if (depth.status === DepthFeedStatus.Healthy) {
        const bid = depth.book.bids.find(([price, quantity]) => price > 0 && quantity > 0)?.[0];
        const ask = depth.book.asks.find(([price, quantity]) => price > 0 && quantity > 0)?.[0];
        if (bid && ask && ask > bid) {
            fallbackMidpoint = (bid + ask) / 2;
            if (!priceRangeForFrame) priceRangeForFrame = priceRangeFromExtent({ hi: ask, lo: bid }, tickSize);
        }
    }
    if (!priceRangeForFrame && visible.liquidity) {
        priceRangeForFrame = priceRangeFromExtent(liquidity.visiblePriceExtent(startT, endT), tickSize);
    }

    if (priceView.mode === PriceViewMode.Manual) {
        priceRangeForFrame = priceView.range;
    } else if (priceView.mode === PriceViewMode.Centered && priceRangeForFrame) {
        const midpoint = latestVisiblePoint ? (latestVisiblePoint.bid + latestVisiblePoint.ask) / 2 : fallbackMidpoint;
        if (midpoint != null) {
            const span = priceView.span ?? priceRangeForFrame.hi - priceRangeForFrame.lo;
            priceRangeForFrame = priceRangeAround(midpoint, span, tickSize);
        }
    }

    return {
        data,
        depthStatus: depth.status,
        endT,
        follow: view.follow,
        L,
        liquidityStatus: liquidity.status,
        priceDec: decimalsForRange(priceRangeForFrame ? priceRangeForFrame.hi - priceRangeForFrame.lo : 1, tickSize),
        priceMode: priceView.mode,
        priceRange: priceRangeForFrame,
        spanMs: view.spanMs,
        spreadDec: decimalsForRange(window.spreadRange ? window.spreadRange.hi : 1, tickSize) + 1,
        spreadRange: window.spreadRange,
        startT,
        tickSize,
        visible,
        window,
        xFor: (t) => L.padL + ((t - startT) / view.spanMs) * L.plotW,
    };
};

const interactionFrame = (L: Layout, priceRange: Range | null): TickChartInteractionFrame => ({
    axisLeft: L.axisLeft,
    bottomY: L.bottomY,
    mainBottom: L.mainTop + L.mainH,
    mainTop: L.mainTop,
    plotLeft: L.padL,
    plotRight: L.padL + L.plotW,
    priceBodyRight: L.axisLeft,
    priceRange,
    width: L.w,
});

const timeAtX = (F: RenderFrame, x: number) => F.startT + ((x - F.L.padL) / F.L.plotW) * F.spanMs;

// Step-after line: a value holds until the next change, then jumps. The final
// value is extended to the right edge ("now"). The point straddling the left edge
// is clamped to the plot's left so its value fills the window start.
const strokeStep = (
    ctx: CanvasRenderingContext2D,
    F: RenderFrame,
    value: ValueFn,
    yFor: Scale,
    color: string,
    lineWidth: number,
) => {
    ctx.beginPath();
    let started = false;
    let lastY = 0;
    for (let i = F.window.pointStart; i < F.window.pointEnd; i++) {
        const p = F.data.points[i];
        const x = Math.max(F.L.padL, F.xFor(p.t));
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
    if (started) ctx.lineTo(F.xFor(F.endT), lastY);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
};

// Bid and ask change at the same points, so each inter-point segment is a flat
// rectangle between the two lines — the visible spread, filled faintly.
const fillSpreadBand = (ctx: CanvasRenderingContext2D, F: RenderFrame, yFor: Scale, color: string) => {
    ctx.fillStyle = color;
    for (let i = F.window.pointStart; i < F.window.pointEnd; i++) {
        const p = F.data.points[i];
        const next = F.data.points[i + 1];
        const xL = Math.max(F.L.padL, F.xFor(p.t));
        const xR = next && next.t <= F.endT ? F.xFor(next.t) : F.xFor(F.endT);
        if (xR > xL) ctx.fillRect(xL, yFor(p.ask), xR - xL, yFor(p.bid) - yFor(p.ask));
        if (!next || next.t > F.endT) break;
    }
};

const drawAxisLabel = (ctx: CanvasRenderingContext2D, L: Layout, y: number, text: string, color: string) => {
    ctx.font = fontPx(9);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(text, L.axisLeft + 4, y);
};

const drawSubAxisLabels = (
    ctx: CanvasRenderingContext2D,
    L: Layout,
    top: number,
    height: number,
    lo: number,
    hi: number,
    formatValue: (v: number) => string,
) => {
    const span = hi - lo;
    if (!(span > 0) || height <= 0) return;

    const yFor = (v: number) => top + (1 - (v - lo) / span) * height;
    const values = [hi, ...niceTicks(lo, hi, 4).filter((v) => v > lo && v < hi), lo].sort((a, b) => b - a);
    const drawnY: number[] = [];
    const drawnText = new Set<string>();

    for (const value of values) {
        const y = Math.max(top + 6, Math.min(top + height - 7, yFor(value)));
        const text = formatValue(value);
        if (drawnText.has(text) || drawnY.some((drawn) => Math.abs(drawn - y) < 13)) continue;
        drawnText.add(text);
        drawnY.push(y);
        drawAxisLabel(ctx, L, y, text, palette.fgDim);
    }
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
    ctx.fillRect(L.axisLeft, y - 7, RIGHT_GUTTER - 1, 14);
    ctx.fillStyle = fg;
    ctx.fillText(text, L.axisLeft + 4, y);
};

const drawFrame = (ctx: CanvasRenderingContext2D, L: Layout, visible: SeriesVisibility) => {
    ctx.lineWidth = 1;
    const xR = L.w - L.padR + 0.5;
    ctx.strokeStyle = palette.bd;
    ctx.beginPath();
    ctx.moveTo(xR, L.mainTop);
    ctx.lineTo(xR, L.bottomY);
    ctx.stroke();
    // Brighter dividers so the visible regions read as distinct panels.
    ctx.strokeStyle = palette.bdHi;
    const dividers: number[] = [];
    if (visible.spread) dividers.push(L.spreadTop - GAP / 2);
    if (visible.volume) dividers.push(L.volTop - GAP / 2);
    for (const yy of dividers) {
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
const drawLegend = (ctx: CanvasRenderingContext2D, F: RenderFrame, hover: Hover) => {
    const { L, data, visible } = F;
    const plotRight = L.w - L.padR;
    let point: TickPoint | null = null;
    let trade: TradeMark | null = null;
    if (hover && hover.x >= L.padL && hover.x <= plotRight) {
        const t = timeAtX(F, hover.x);
        const pointIndex = upperBoundT(data.points, t) - 1;
        point = pointIndex >= 0 ? data.points[pointIndex] : null;
        const tradeIndex = upperBoundT(data.trades, t) - 1;
        trade = tradeIndex >= 0 ? data.trades[tradeIndex] : null;
    }

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

    const freshness = visible.liquidity
        ? { label: 'LIQ', status: F.liquidityStatus }
        : visible.book
          ? { label: 'BOOK', status: F.depthStatus }
          : null;
    const freshnessSegment = freshness
        ? {
              color:
                  freshness.status === DepthFeedStatus.Healthy
                      ? palette.heatLo
                      : freshness.status === DepthFeedStatus.Stale
                        ? palette.down
                        : palette.ac,
              text: `${freshness.label} ${
                  freshness.status === DepthFeedStatus.Healthy
                      ? 'LIVE'
                      : freshness.status === DepthFeedStatus.Stale
                        ? 'STALE'
                        : 'SYNC'
              }`,
          }
        : null;

    row(L.mainTop, 'TICKS', [
        { color: palette.fgDim, text: fmtSpan(F.spanMs) },
        ...(F.priceMode === PriceViewMode.Manual ? [{ color: palette.ac, text: 'Y FREE' }] : []),
        ...(freshnessSegment ? [freshnessSegment] : []),
        ...(point
            ? [
                  { color: palette.up, text: `bid ${formatPrice(point.bid, F.priceDec)}` },
                  { color: palette.down, text: `ask ${formatPrice(point.ask, F.priceDec)}` },
              ]
            : []),
    ]);
    if (visible.spread)
        row(
            L.spreadTop,
            'SPREAD',
            point ? [{ color: palette.heatLo, text: formatPrice(point.ask - point.bid, F.spreadDec) }] : [],
        );
    if (visible.volume)
        row(
            L.volTop,
            'VOLUME',
            trade ? [{ color: trade.buy ? palette.up : palette.down, text: fmtVol(trade.size * trade.price) }] : [],
        );
};

const drawTimeGrid = (ctx: CanvasRenderingContext2D, F: RenderFrame) => {
    const { L, endT, startT } = F;
    const step = pickTimeStep(endT - startT);
    const bottom = L.bottomY;
    ctx.font = fontPx(9);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let t = Math.ceil(startT / step) * step; t <= endT; t += step) {
        const x = F.xFor(t);
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

const drawMain = (ctx: CanvasRenderingContext2D, F: RenderFrame) => {
    const { L, data, priceRange: pr } = F;
    if (!pr) return;
    const span = pr.hi - pr.lo || 1;
    const yFor: Scale = (v) => L.mainTop + (1 - (v - pr.lo) / span) * L.mainH;
    const tagTop = L.mainTop + 7;
    const tagBottom = L.mainTop + L.mainH - 7;
    const clampY = (y: number) => Math.max(tagTop, Math.min(tagBottom, y));

    for (const tick of niceTicks(pr.lo, pr.hi)) {
        const y = yFor(tick);
        ctx.strokeStyle = palette.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(L.padL, y + 0.5);
        ctx.lineTo(L.w - L.padR, y + 0.5);
        ctx.stroke();
        drawAxisLabel(ctx, L, y, formatPrice(tick, F.priceDec), palette.fgDim);
    }

    // Manual ranges may put the market entirely above or below the viewport.
    // Clip price-series geometry so it cannot bleed into spread/volume panes.
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.padL, L.mainTop, L.plotW, L.mainH);
    ctx.clip();
    fillSpreadBand(ctx, F, yFor, withAlpha(palette.ac, 0.05));
    strokeStep(ctx, F, (p) => p.bid, yFor, palette.up, 1.25);
    strokeStep(ctx, F, (p) => p.ask, yFor, palette.down, 1.25);

    ctx.fillStyle = palette.ac;
    ctx.strokeStyle = palette.bg;
    ctx.lineWidth = 0.5;
    for (let i = F.window.tradeStart; i < F.window.tradeEnd; i++) {
        const tr = data.trades[i];
        const y = yFor(tr.price);
        if (y < L.mainTop || y > L.mainTop + L.mainH) continue;
        ctx.beginPath();
        ctx.arc(F.xFor(tr.t), y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();

    const cur = data.points[F.window.pointEnd - 1];
    if (cur) {
        let askY = clampY(yFor(cur.ask));
        let bidY = clampY(yFor(cur.bid));
        if (Math.abs(askY - bidY) < 14) {
            const midpoint = (askY + bidY) / 2;
            askY = midpoint - 7;
            bidY = midpoint + 7;

            // Keep the separated pair inside the pane without moving it away
            // from the current-price line unless it is already at an edge.
            if (askY < tagTop) {
                bidY += tagTop - askY;
                askY = tagTop;
            } else if (bidY > tagBottom) {
                askY -= bidY - tagBottom;
                bidY = tagBottom;
            }
        }
        const priceText = (price: number) =>
            `${price > pr.hi ? '↑' : price < pr.lo ? '↓' : ''}${formatPrice(price, F.priceDec)}`;
        drawTag(ctx, L, askY, priceText(cur.ask), palette.down);
        drawTag(ctx, L, bidY, priceText(cur.bid), palette.up);
    }
};

// Resting order-book depth as horizontal bars in the column right of the plot, on the
// same price axis as drawMain. Grouping is derived from the visible price range so the
// rows stay ~BOOK_ROW_PX tall at any zoom, and only buckets inside [pr.lo, pr.hi] are
// drawn — zooming in narrows the column to the levels around the spread.
const drawBook = (ctx: CanvasRenderingContext2D, F: RenderFrame, book: LocalOrderBook) => {
    const { L, priceRange: pr, tickSize } = F;
    if (!pr || (book.bids.length === 0 && book.asks.length === 0)) return;
    const span = pr.hi - pr.lo || 1;
    const yFor: Scale = (v) => L.mainTop + (1 - (v - pr.lo) / span) * L.mainH;

    const rows = Math.max(1, Math.floor(L.mainH / BOOK_ROW_PX));
    const groupByVal = niceBucket(span / rows, tickSize);
    const rowsPerSide = Math.ceil(span / groupByVal) + 2;
    const grouped = groupOrders(book, groupByVal, rowsPerSide);

    const inRange = ([price]: OrderBookLevel) => price >= pr.lo && price <= pr.hi;
    const asks = grouped.asks.filter(inRange);
    const bids = grouped.bids.filter(inRange);
    if (asks.length === 0 && bids.length === 0) return;

    let maxSize = 0;
    for (const [, qty] of asks) if (qty > maxSize) maxSize = qty;
    for (const [, qty] of bids) if (qty > maxSize) maxSize = qty;
    if (maxSize <= 0) return;

    const rowH = Math.max(1, (groupByVal / span) * L.mainH - 1);
    const drawSide = (levels: OrderBookLevel[], color: string) => {
        ctx.fillStyle = color;
        for (const [price, qty] of levels) {
            // Square-root scale: keeps smaller levels visible instead of a single
            // dominant wall squashing the rest of the column toward zero width.
            const barLen = Math.sqrt(qty / maxSize) * BOOK_W;
            ctx.fillRect(L.axisLeft - barLen, yFor(price) - rowH / 2, barLen, rowH);
        }
    };
    drawSide(asks, withAlpha(palette.down, 0.6));
    drawSide(bids, withAlpha(palette.up, 0.6));
};

const drawSpread = (ctx: CanvasRenderingContext2D, F: RenderFrame) => {
    const { L, data, spreadRange: sr, tickSize } = F;
    if (!sr) return;
    const span = sr.hi - sr.lo || 1;
    const yFor: Scale = (v) => L.spreadTop + (1 - (v - sr.lo) / span) * L.spreadH;

    strokeStep(ctx, F, (p) => normalizeSpread(p.ask - p.bid, tickSize), yFor, palette.heatLo, 1.1);

    drawSubAxisLabels(ctx, L, L.spreadTop, L.spreadH, sr.lo, sr.hi, (v) => formatPrice(v, F.spreadDec));
    const cur = data.points[F.window.pointEnd - 1];
    if (cur) {
        const v = normalizeSpread(cur.ask - cur.bid, tickSize);
        const y = Math.max(L.spreadTop + 7, Math.min(L.spreadTop + L.spreadH - 7, yFor(v)));
        drawTag(ctx, L, y, formatPrice(v, F.spreadDec), palette.heatLo);
    }
};

const drawVolume = (ctx: CanvasRenderingContext2D, F: RenderFrame) => {
    const { L, data } = F;
    const mv = F.window.volumeMax;
    if (mv <= 0) return;
    const baseY = L.volTop + L.volH;
    for (let i = F.window.tradeStart; i < F.window.tradeEnd; i++) {
        const tr = data.trades[i];
        ctx.fillStyle = tr.buy ? palette.up : palette.down;
        const usd = tr.size * tr.price;
        ctx.fillRect(F.xFor(tr.t) - 0.75, baseY - (usd / mv) * L.volH, 1.5, (usd / mv) * L.volH);
    }
    drawSubAxisLabels(ctx, L, L.volTop, L.volH, 0, mv, fmtVol);
};

const drawCrosshair = (ctx: CanvasRenderingContext2D, F: RenderFrame, hover: { x: number; y: number }) => {
    const { L, priceRange: pr } = F;
    const plotRight = L.w - L.padR;
    const plotBottom = L.bottomY;
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

    const t = timeAtX(F, x);
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
            drawTag(ctx, L, y, formatPrice(price, F.priceDec), palette.bdHi, palette.fg);
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
    depth: DepthState,
    liquidity: LiquidityTimeline,
    liquidityPreferences: LiquidityPreferences,
    liquidityCache: LiquidityRenderCache,
    priceView: PriceView,
    visible: SeriesVisibility,
): TickChartInteractionFrame | null => {
    const L = computeLayout(size.w, size.h, visible);
    ctx.clearRect(0, 0, size.w, size.h);
    if (L.plotW <= 0 || L.mainH <= 0) return null;

    const F = makeFrame(L, data, view, tickSize, priceView, visible, depth, liquidity);
    const interaction = interactionFrame(L, F.priceRange);
    if (!F.priceRange) {
        drawFrame(ctx, L, visible);
        const status = visible.liquidity ? liquidity.status : visible.book ? depth.status : null;
        const waitingText =
            status === DepthFeedStatus.Stale
                ? 'market depth stale — reconnecting…'
                : status === DepthFeedStatus.Syncing
                  ? 'synchronizing market depth…'
                  : 'waiting for data…';
        ctx.font = fontPx(11);
        ctx.fillStyle = palette.fgDim;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(waitingText, L.padL + L.plotW / 2, L.mainTop + L.mainH / 2);
        return interaction;
    }

    let preparedLiquidity = null;
    let liquidityViewport: LiquidityViewport | null = null;
    if (visible.liquidity) {
        liquidityViewport = {
            endT: F.endT,
            follow: F.follow,
            mainH: L.mainH,
            mainTop: L.mainTop,
            plotLeft: L.padL,
            plotW: L.plotW,
            priceDec: F.priceDec,
            priceHi: F.priceRange.hi,
            priceLo: F.priceRange.lo,
            spanMs: F.spanMs,
            startT: F.startT,
            tickSize: F.tickSize,
        };
        preparedLiquidity = liquidityCache.get(liquidity, liquidityViewport, liquidityPreferences);
        drawLiquidity(ctx, preparedLiquidity, liquidityViewport);
    }

    drawFrame(ctx, L, visible);
    drawTimeGrid(ctx, F);
    drawMain(ctx, F);
    if (visible.book && depth.status === DepthFeedStatus.Healthy) drawBook(ctx, F, depth.book);
    if (visible.spread) drawSpread(ctx, F);
    if (visible.volume) drawVolume(ctx, F);
    drawLegend(ctx, F, hover);
    if (hover) drawCrosshair(ctx, F, hover);
    if (hover && preparedLiquidity && liquidityViewport) {
        drawLiquidityTooltip(ctx, preparedLiquidity, liquidityViewport, hover);
    }
    return interaction;
};
