// Pure, DOM-free helpers for the canvas tick chart. Kept separate from rendering
// so the scale/range/view math can be reasoned about (and unit-tested) on its own.

// A top-of-book snapshot recorded whenever best bid or best ask changed.
export type TickPoint = { t: number; bid: number; ask: number };

// A single executed trade. `buy` is the aggressor side (taker bought).
export type TradeMark = { t: number; price: number; size: number; buy: boolean };

// The visible time window. `endT` is the timestamp at the right edge; while
// `follow` is on it tracks "now", otherwise it is frozen (the user panned back).
export type TickView = { spanMs: number; endT: number; follow: boolean };

export type Range = { lo: number; hi: number };

export const PriceViewMode = {
    Auto: 'auto',
    Centered: 'centered',
    Manual: 'manual',
} as const;

export type PriceViewMode = (typeof PriceViewMode)[keyof typeof PriceViewMode];

// Auto derives a fresh range from visible data. Centered follows the latest
// visible midpoint at a fixed span. Manual remains fixed in absolute prices.
export type PriceView =
    | { mode: typeof PriceViewMode.Auto }
    | { mode: typeof PriceViewMode.Centered; span: number | null }
    | { mode: typeof PriceViewMode.Manual; range: Range };

export type TickWindow = {
    pointEnd: number;
    pointStart: number;
    priceRange: Range | null;
    spreadRange: Range | null;
    tradeEnd: number;
    tradeStart: number;
    volumeMax: number;
};

// Zoom limits: from a 2s firehose view out to a 30m overview.
export const SPAN_MIN = 2_000;
export const SPAN_MAX = 30 * 60_000;
export const SPAN_DEFAULT = 60_000;

const PRICE_PAD = 0.06; // headroom above/below the price extent so lines don't touch edges
const MIN_PRICE_SPAN_TICKS = 64; // keeps a one-tick spread from filling the price pane
const MIN_PRICE_SPAN_RATIO = 0.001; // keeps sparse order-book ladders visible on high-priced symbols

export const clampSpan = (span: number) => Math.max(SPAN_MIN, Math.min(SPAN_MAX, span));

// Human-readable visible window: seconds below a minute, otherwise minutes.
export const fmtSpan = (ms: number): string => {
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    const m = ms / 60_000;
    return Number.isInteger(m) ? `${m}m` : `${m.toFixed(1)}m`;
};

// First index whose `t` is >= target, over a time-sorted array. Lets us scan only
// the visible slice instead of the whole (up to 20k-element) buffer each frame.
export const lowerBoundT = (arr: { t: number }[], t: number): number => {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].t < t) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};

// First index whose `t` is strictly greater than target. Subtracting one selects
// the state active at target, including the new state at an exact boundary.
export const upperBoundT = (arr: { t: number }[], t: number): number => {
    let lo = 0;
    let hi = arr.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid].t <= t) lo = mid + 1;
        else hi = mid;
    }
    return lo;
};

const paddedPriceRange = (lo: number, hi: number, tickSize: number): Range | null => {
    if (lo === Infinity) return null;
    const mid = (lo + hi) / 2;
    const minSpan = Math.max(tickSize > 0 ? tickSize * MIN_PRICE_SPAN_TICKS : 0, Math.abs(mid) * MIN_PRICE_SPAN_RATIO);
    if (lo === hi) {
        const fallbackPad = lo === 0 ? 1 : Math.abs(lo) * 0.001;
        const halfSpan = minSpan > 0 ? minSpan / 2 : fallbackPad;
        return { hi: mid + halfSpan, lo: mid - halfSpan };
    }
    const pad = (hi - lo) * PRICE_PAD;
    let paddedLo = lo - pad;
    let paddedHi = hi + pad;
    if (minSpan > 0 && paddedHi - paddedLo < minSpan) {
        const halfSpan = minSpan / 2;
        paddedLo = mid - halfSpan;
        paddedHi = mid + halfSpan;
    }
    return { hi: paddedHi, lo: paddedLo };
};

export const priceRangeFromExtent = (range: Range | null, tickSize: number): Range | null =>
    range ? paddedPriceRange(range.lo, range.hi, tickSize) : null;

const minimumPriceSpan = (center: number, tickSize: number): number =>
    Math.max(
        tickSize > 0 ? tickSize * MIN_PRICE_SPAN_TICKS : 0,
        Math.abs(center) * MIN_PRICE_SPAN_RATIO,
        Number.EPSILON,
    );

// Keep manual ranges numerically valid, above the zero-price floor, and no
// tighter than the same minimum used by automatic price fitting.
export const constrainPriceRange = (range: Range, tickSize: number): Range => {
    if (!Number.isFinite(range.lo) || !Number.isFinite(range.hi) || !(range.hi > range.lo)) return range;
    const center = (range.lo + range.hi) / 2;
    const span = Math.max(range.hi - range.lo, minimumPriceSpan(center, tickSize));
    let lo = center - span / 2;
    let hi = center + span / 2;
    if (lo < 0) {
        hi -= lo;
        lo = 0;
    }
    return { hi, lo };
};

export const priceRangeAround = (center: number, span: number, tickSize: number): Range =>
    constrainPriceRange({ hi: center + span / 2, lo: center - span / 2 }, tickSize);

export const priceAtY = (range: Range, y: number, top: number, height: number): number => {
    if (!(height > 0)) return (range.lo + range.hi) / 2;
    const fraction = Math.max(0, Math.min(1, (y - top) / height));
    return range.hi - fraction * (range.hi - range.lo);
};

// Price content follows the pointer: dragging down raises the visible range,
// while dragging up reveals lower prices.
export const panPriceRange = (range: Range, deltaY: number, height: number, tickSize: number): Range => {
    if (!(height > 0) || !Number.isFinite(deltaY)) return range;
    const deltaPrice = (deltaY / height) * (range.hi - range.lo);
    return constrainPriceRange({ hi: range.hi + deltaPrice, lo: range.lo + deltaPrice }, tickSize);
};

export const zoomPriceRange = (range: Range, anchor: number, factor: number, tickSize: number): Range => {
    if (!Number.isFinite(anchor) || !Number.isFinite(factor) || !(factor > 0)) return range;
    return constrainPriceRange(
        {
            hi: anchor + (range.hi - anchor) * factor,
            lo: anchor - (anchor - range.lo) * factor,
        },
        tickSize,
    );
};

const paddedSpreadRange = (lo: number, hi: number, tickSize: number): Range | null => {
    if (hi === -Infinity) return null;
    const floor = tickSize > 0 ? tickSize : lo === Infinity ? 0 : lo;
    if (hi <= floor) {
        const span = floor > 0 ? floor : 1;
        return { hi: floor + span, lo: floor };
    }
    const pad = (hi - floor) * 0.1;
    return { hi: hi + pad, lo: floor };
};

// Re-center a range on `c`, growing the smaller half to match the larger so the
// whole original range stays visible with `c` at the vertical middle.
export const centerRange = (r: Range, c: number): Range => {
    const half = Math.max(r.hi - c, c - r.lo);
    return { hi: c + half, lo: c - half };
};

export const normalizeSpread = (spread: number, tickSize: number): number => {
    if (!(tickSize > 0)) return spread;
    return Math.max(tickSize, Math.round(spread / tickSize) * tickSize);
};

// Visible slice and extents for one render frame. Points include the item just
// before the left edge so the step line can hold its value into the viewport.
export const tickWindow = (
    points: TickPoint[],
    trades: TradeMark[],
    t0: number,
    t1: number,
    tickSize: number,
): TickWindow => {
    const pointStart = Math.max(0, lowerBoundT(points, t0) - 1);
    const tradeStart = lowerBoundT(trades, t0);
    let pointEnd = pointStart;
    let tradeEnd = tradeStart;

    let priceLo = Infinity;
    let priceHi = -Infinity;
    let spreadLo = Infinity;
    let spreadHi = -Infinity;
    let volumeMax = 0;

    for (let i = pointStart; i < points.length; i++) {
        const p = points[i];
        if (p.t > t1) break;
        pointEnd = i + 1;
        if (p.bid < priceLo) priceLo = p.bid;
        if (p.ask > priceHi) priceHi = p.ask;
        const s = normalizeSpread(p.ask - p.bid, tickSize);
        if (s > 0 && s < spreadLo) spreadLo = s;
        if (s > spreadHi) spreadHi = s;
    }

    for (let i = tradeStart; i < trades.length; i++) {
        const tr = trades[i];
        if (tr.t > t1) break;
        tradeEnd = i + 1;
        if (tr.price < priceLo) priceLo = tr.price;
        if (tr.price > priceHi) priceHi = tr.price;
        const volume = tr.size * tr.price;
        if (volume > volumeMax) volumeMax = volume;
    }

    return {
        pointEnd,
        pointStart,
        priceRange: paddedPriceRange(priceLo, priceHi, tickSize),
        spreadRange: paddedSpreadRange(spreadLo, spreadHi, tickSize),
        tradeEnd,
        tradeStart,
        volumeMax,
    };
};

// "Nice" round axis tick values (1/2/5 * 10^n) covering [min, max].
export const niceTicks = (min: number, max: number, count = 5): number[] => {
    if (!isFinite(min) || !isFinite(max) || min >= max) return [];
    const rawStep = (max - min) / count;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const ticks: number[] = [];
    for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-3; v += step) ticks.push(v);
    return ticks;
};

// Smallest "nice" price bucket (1/2/5 * 10^n ticks, never below one tick) that is at
// least `target` wide. Used to size the order-book rows adaptively from the visible
// price range so they stay a readable height and don't jitter as zoom changes.
export const niceBucket = (target: number, tickSize: number): number => {
    const unit = tickSize > 0 ? tickSize : 1;
    const ticks = Math.max(1, target / unit); // ideal ticks-per-bucket, floored at 1
    const mag = Math.pow(10, Math.floor(Math.log10(ticks)));
    const norm = ticks / mag;
    const mult = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return mult * mag * unit;
};

// Decimal places for price labels: enough to honor the instrument's tick size and
// to keep adjacent gridlines distinct across the visible range.
export const decimalsForRange = (range: number, tickSize: number): number => {
    const fromTick = tickSize > 0 ? Math.max(0, -Math.floor(Math.log10(tickSize))) : 0;
    const fromRange = range > 0 ? Math.ceil(-Math.log10(range / 5)) : 0;
    return Math.max(0, Math.min(8, Math.max(fromTick, fromRange)));
};

// Keep the window within available data: snap to live when it reaches "now",
// and don't let it scroll left of the first recorded point.
export const clampView = (view: TickView, firstT: number | null, now: number): TickView => {
    if (view.endT >= now) return { ...view, endT: now, follow: true };
    if (firstT != null) {
        const minEnd = firstT + view.spanMs * 0.1; // keep at least a sliver of data visible
        if (view.endT < minEnd) return { ...view, endT: minEnd, follow: false };
    }
    return view.follow ? { ...view, follow: false } : view;
};
