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

// Zoom limits: from a 2s firehose view out to a 30m overview.
export const SPAN_MIN = 2_000;
export const SPAN_MAX = 30 * 60_000;
export const SPAN_DEFAULT = 60_000;

const PRICE_PAD = 0.06; // headroom above/below the price extent so lines don't touch edges

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

// Min/max price across the visible window, including the one point straddling the
// left edge (its value holds into view) plus any trades. `null` when nothing visible.
export const priceRange = (points: TickPoint[], trades: TradeMark[], t0: number, t1: number): Range | null => {
    let lo = Infinity;
    let hi = -Infinity;

    for (let i = Math.max(0, lowerBoundT(points, t0) - 1); i < points.length; i++) {
        const p = points[i];
        if (p.t > t1) break;
        if (p.bid < lo) lo = p.bid;
        if (p.ask > hi) hi = p.ask;
    }
    for (let i = lowerBoundT(trades, t0); i < trades.length; i++) {
        const tr = trades[i];
        if (tr.t > t1) break;
        if (tr.price < lo) lo = tr.price;
        if (tr.price > hi) hi = tr.price;
    }

    if (lo === Infinity) return null;
    if (lo === hi) {
        const pad = lo === 0 ? 1 : Math.abs(lo) * 0.001;
        return { hi: hi + pad, lo: lo - pad };
    }
    const pad = (hi - lo) * PRICE_PAD;
    return { hi: hi + pad, lo: lo - pad };
};

// Re-center a range on `c`, growing the smaller half to match the larger so the
// whole original range stays visible with `c` at the vertical middle.
export const centerRange = (r: Range, c: number): Range => {
    const half = Math.max(r.hi - c, c - r.lo);
    return { hi: c + half, lo: c - half };
};

// Spread (ask - bid) extent, floored at 0 so the baseline is always zero.
export const spreadRange = (points: TickPoint[], t0: number, t1: number): Range | null => {
    let hi = -Infinity;
    for (let i = Math.max(0, lowerBoundT(points, t0) - 1); i < points.length; i++) {
        const p = points[i];
        if (p.t > t1) break;
        const s = p.ask - p.bid;
        if (s > hi) hi = s;
    }
    if (hi === -Infinity) return null;
    return { hi: hi <= 0 ? 1 : hi * 1.1, lo: 0 };
};

// Largest trade notional (USD) in the window, for scaling the volume bars.
export const maxVolume = (trades: TradeMark[], t0: number, t1: number): number => {
    let m = 0;
    for (let i = lowerBoundT(trades, t0); i < trades.length; i++) {
        const tr = trades[i];
        if (tr.t > t1) break;
        const usd = tr.size * tr.price;
        if (usd > m) m = usd;
    }
    return m;
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
