import type { DepthCoverage, DepthSideCoverage, NormalizedTrade } from '@/services/exchanges/types';

const DomSide = {
    Ask: 'ask',
    Bid: 'bid',
} as const;

type DomSide = (typeof DomSide)[keyof typeof DomSide];

export const DomRowRole = {
    Ask: 'ask',
    Bid: 'bid',
    Level: 'level',
} as const;

export type DomRowRole = (typeof DomRowRole)[keyof typeof DomRowRole];

export const DomRowCoverage = {
    Complete: 'complete',
    Partial: 'partial',
    Unavailable: 'unavailable',
} as const;
export type DomRowCoverage = (typeof DomRowCoverage)[keyof typeof DomRowCoverage];

type DomGroupedBuildInput = {
    askPullStack: ReadonlyMap<number, number>;
    bidPullStack: ReadonlyMap<number, number>;
    buyVolume: ReadonlyMap<number, number>;
    centerTick?: number | null;
    coverage: DepthCoverage;
    groupedBook: GroupedBook;
    groupTicks: number;
    lastTrade: NormalizedTrade | null;
    pullStackRowCount?: number;
    rowCount: number;
    sellVolume: ReadonlyMap<number, number>;
    tickSize: number;
};

export type DomLadderRow = {
    askCoverage: DomRowCoverage;
    askDepthPercent: number;
    askPullStack: number;
    askPullStackPercent: number;
    askSize: number;
    bidCoverage: DomRowCoverage;
    bidDepthPercent: number;
    bidPullStack: number;
    bidPullStackPercent: number;
    bidSize: number;
    buyVolume: number;
    groupTick: number;
    isBestAsk: boolean;
    isBestBid: boolean;
    isLastTrade: boolean;
    key: string;
    price: number;
    role: DomRowRole;
    sellVolume: number;
};

const equivalentDomRow = (previous: DomLadderRow, next: DomLadderRow): boolean =>
    previous.askCoverage === next.askCoverage &&
    previous.askDepthPercent === next.askDepthPercent &&
    previous.askPullStack === next.askPullStack &&
    previous.askPullStackPercent === next.askPullStackPercent &&
    previous.askSize === next.askSize &&
    previous.bidCoverage === next.bidCoverage &&
    previous.bidDepthPercent === next.bidDepthPercent &&
    previous.bidPullStack === next.bidPullStack &&
    previous.bidPullStackPercent === next.bidPullStackPercent &&
    previous.bidSize === next.bidSize &&
    previous.buyVolume === next.buyVolume &&
    previous.groupTick === next.groupTick &&
    previous.isBestAsk === next.isBestAsk &&
    previous.isBestBid === next.isBestBid &&
    previous.isLastTrade === next.isLastTrade &&
    previous.key === next.key &&
    previous.price === next.price &&
    previous.role === next.role &&
    previous.sellVolume === next.sellVolume;

export const stabilizeDomRows = (previous: DomLadderRow[], next: DomLadderRow[]): DomLadderRow[] => {
    if (previous.length === 0 || next.length === 0) return next.length === 0 && previous.length === 0 ? previous : next;

    const previousByKey = new Map(previous.map((row) => [row.key, row]));
    let unchanged = previous.length === next.length;
    const stableRows = next.map((row, index) => {
        const candidate = previousByKey.get(row.key);
        const stableRow = candidate && equivalentDomRow(candidate, row) ? candidate : row;
        if (stableRow !== previous[index]) unchanged = false;
        return stableRow;
    });

    return unchanged ? previous : stableRows;
};

export type GroupedBook = {
    asks: Map<number, number>;
    bestAskTick: number | null;
    bestBidTick: number | null;
    bids: Map<number, number>;
};

const safeGroupTicks = (value: number): number =>
    Number.isFinite(value) ? Math.max(1, Math.min(1_000_000, Math.floor(value))) : 1;

const safeRowCount = (value: number): number =>
    Number.isFinite(value) ? Math.max(0, Math.min(500, Math.floor(value))) : 0;

const finiteQuantity = (value: number | undefined): number =>
    value !== undefined && Number.isFinite(value) ? value : 0;

export const normalizeNearZero = (value: number, scale: number): number => {
    if (!Number.isFinite(value)) return 0;
    const finiteScale = Number.isFinite(scale) ? Math.abs(scale) : 0;
    const tolerance = Number.EPSILON * Math.max(finiteScale, Number.MIN_VALUE) * 16;
    return Math.abs(value) <= tolerance ? 0 : value;
};

export const priceToTick = (price: number, tickSize: number): number | null => {
    if (!Number.isFinite(price) || !Number.isFinite(tickSize) || price <= 0 || tickSize <= 0) return null;
    const tick = Math.round(price / tickSize);
    return Number.isSafeInteger(tick) ? tick : null;
};

const tickToPrice = (tick: number, tickSize: number): number => {
    if (!Number.isSafeInteger(tick) || !Number.isFinite(tickSize) || tickSize <= 0) return 0;
    const value = tick * tickSize;
    return Number.isFinite(value) ? Number(value.toPrecision(15)) : 0;
};

export const groupTick = (tick: number, groupTicks: number): number | null => {
    if (!Number.isSafeInteger(tick)) return null;
    const group = safeGroupTicks(groupTicks);
    // The ladder label is the lower bound of a grouped interval. Both sides use
    // that same label, then split into ask/bid rows when the inside market lands
    // in one interval (matching the reference Depth & Sales behavior).
    const grouped = Math.floor(tick / group) * group;
    return Number.isSafeInteger(grouped) ? grouped : null;
};

export const pullStackDelta = (previousQuantity: number, currentQuantity: number): number => {
    if (!Number.isFinite(previousQuantity) || !Number.isFinite(currentQuantity)) return 0;
    return normalizeNearZero(
        currentQuantity - previousQuantity,
        Math.max(Math.abs(previousQuantity), Math.abs(currentQuantity)),
    );
};

const alignCenter = (tick: number, groupTicks: number): number => {
    const group = safeGroupTicks(groupTicks);
    return Math.round(tick / group) * group;
};

const defaultCenter = (bestBidTick: number | null, bestAskTick: number | null, groupTicks: number): number | null => {
    if (bestBidTick !== null && bestAskTick !== null) return alignCenter((bestBidTick + bestAskTick) / 2, groupTicks);
    if (bestBidTick !== null) return alignCenter(bestBidTick, groupTicks);
    if (bestAskTick !== null) return alignCenter(bestAskTick, groupTicks);
    return null;
};

const priceTicks = (center: number, groupTicks: number, count: number): number[] => {
    if (count <= 0) return [];
    const group = safeGroupTicks(groupTicks);
    const high = center + Math.floor((count - 1) / 2) * group;
    return Array.from({ length: count }, (_, index) => high - index * group);
};

const rowCoverage = (
    groupTickValue: number,
    groupTicks: number,
    tickSize: number,
    coverage: DepthSideCoverage,
    isBid: boolean,
): DomRowCoverage => {
    if (!coverage.truncated) return DomRowCoverage.Complete;
    const farTick = coverage.farPrice === null ? null : priceToTick(coverage.farPrice, tickSize);
    const groupHigh = groupTickValue + groupTicks - 1;
    if (farTick === null || !Number.isSafeInteger(groupHigh)) return DomRowCoverage.Unavailable;
    if (isBid) {
        if (groupTickValue >= farTick) return DomRowCoverage.Complete;
        if (groupHigh < farTick) return DomRowCoverage.Unavailable;
        return DomRowCoverage.Partial;
    }
    if (groupHigh <= farTick) return DomRowCoverage.Complete;
    if (groupTickValue > farTick) return DomRowCoverage.Unavailable;
    return DomRowCoverage.Partial;
};

const makeRow = (
    tick: number,
    role: DomRowRole,
    tickSize: number,
    groupTicks: number,
    grouped: GroupedBook,
    coverage: DepthCoverage,
    buyVolume: ReadonlyMap<number, number>,
    sellVolume: ReadonlyMap<number, number>,
    bidPullStack: ReadonlyMap<number, number>,
    askPullStack: ReadonlyMap<number, number>,
    lastTradeTick: number | null,
    lastTradeRole: DomSide | null,
): DomLadderRow => {
    const showBid = role !== DomRowRole.Ask;
    const showAsk = role !== DomRowRole.Bid;
    return {
        askCoverage: rowCoverage(tick, groupTicks, tickSize, coverage.asks, false),
        askDepthPercent: 0,
        askPullStack: showAsk ? finiteQuantity(askPullStack.get(tick)) : 0,
        askPullStackPercent: 0,
        askSize: showAsk ? finiteQuantity(grouped.asks.get(tick)) : 0,
        bidCoverage: rowCoverage(tick, groupTicks, tickSize, coverage.bids, true),
        bidDepthPercent: 0,
        bidPullStack: showBid ? finiteQuantity(bidPullStack.get(tick)) : 0,
        bidPullStackPercent: 0,
        bidSize: showBid ? finiteQuantity(grouped.bids.get(tick)) : 0,
        buyVolume: showAsk ? finiteQuantity(buyVolume.get(tick)) : 0,
        groupTick: tick,
        isBestAsk: showAsk && tick === grouped.bestAskTick,
        isBestBid: showBid && tick === grouped.bestBidTick,
        isLastTrade: tick === lastTradeTick && (role === DomRowRole.Level || role === lastTradeRole),
        key: `${tick}:${role}`,
        price: tickToPrice(tick, tickSize),
        role,
        sellVolume: showBid ? finiteQuantity(sellVolume.get(tick)) : 0,
    };
};

export const buildDomRows = ({
    askPullStack,
    bidPullStack,
    buyVolume,
    centerTick,
    coverage,
    groupedBook: grouped,
    groupTicks,
    lastTrade,
    pullStackRowCount,
    rowCount,
    sellVolume,
    tickSize,
}: DomGroupedBuildInput): DomLadderRow[] => {
    const count = safeRowCount(rowCount);
    if (!(tickSize > 0) || !Number.isFinite(tickSize) || count === 0) return [];

    const group = safeGroupTicks(groupTicks);
    const fallbackCenter = defaultCenter(grouped.bestBidTick, grouped.bestAskTick, group);
    const requestedCenter =
        centerTick !== null && centerTick !== undefined && Number.isSafeInteger(centerTick)
            ? alignCenter(centerTick, group)
            : fallbackCenter;
    if (requestedCenter === null) return [];

    const insideCollision =
        grouped.bestAskTick !== null && grouped.bestBidTick !== null && grouped.bestAskTick === grouped.bestBidTick
            ? grouped.bestAskTick
            : null;

    let ticks = priceTicks(requestedCenter, group, count);
    if (insideCollision !== null && ticks.includes(insideCollision) && count > 1) {
        const distanceFromHigh = Math.abs(ticks[0] - insideCollision);
        const distanceFromLow = Math.abs(ticks[ticks.length - 1] - insideCollision);
        // The duplicated inside bucket consumes one visual row. Trim the more
        // distant edge so manual centering cannot exceed the requested budget.
        ticks = distanceFromHigh > distanceFromLow ? ticks.slice(1) : ticks.slice(0, -1);
    }

    const lastNativeTick = lastTrade ? priceToTick(lastTrade.price, tickSize) : null;
    const lastTradeRole: DomSide | null = lastTrade ? (lastTrade.isBuyerMaker ? DomSide.Bid : DomSide.Ask) : null;
    const lastTradeTick = lastNativeTick !== null && lastTradeRole !== null ? groupTick(lastNativeTick, group) : null;
    const rows: DomLadderRow[] = [];

    for (const tick of ticks) {
        if (tick === insideCollision && count > 1) {
            rows.push(
                makeRow(
                    tick,
                    DomRowRole.Ask,
                    tickSize,
                    group,
                    grouped,
                    coverage,
                    buyVolume,
                    sellVolume,
                    bidPullStack,
                    askPullStack,
                    lastTradeTick,
                    lastTradeRole,
                ),
            );
            rows.push(
                makeRow(
                    tick,
                    DomRowRole.Bid,
                    tickSize,
                    group,
                    grouped,
                    coverage,
                    buyVolume,
                    sellVolume,
                    bidPullStack,
                    askPullStack,
                    lastTradeTick,
                    lastTradeRole,
                ),
            );
            continue;
        }
        rows.push(
            makeRow(
                tick,
                DomRowRole.Level,
                tickSize,
                group,
                grouped,
                coverage,
                buyVolume,
                sellVolume,
                bidPullStack,
                askPullStack,
                lastTradeTick,
                lastTradeRole,
            ),
        );
    }

    const pullStackCount = safeRowCount(pullStackRowCount ?? count);
    let maxDepth = 0;
    let maxPullStack = 0;
    for (const row of rows) {
        const bidDistance =
            grouped.bestBidTick === null ? Number.POSITIVE_INFINITY : grouped.bestBidTick - row.groupTick;
        const askDistance =
            grouped.bestAskTick === null ? Number.POSITIVE_INFINITY : row.groupTick - grouped.bestAskTick;
        const showBidPullStack = bidDistance >= 0 && bidDistance / group < pullStackCount;
        const showAskPullStack = askDistance >= 0 && askDistance / group < pullStackCount;
        if (!showBidPullStack) row.bidPullStack = 0;
        if (!showAskPullStack) row.askPullStack = 0;
        maxDepth = Math.max(maxDepth, row.bidSize, row.askSize);
        maxPullStack = Math.max(maxPullStack, Math.abs(row.bidPullStack), Math.abs(row.askPullStack));
    }

    for (const row of rows) {
        row.bidDepthPercent = maxDepth > 0 ? Math.min(100, (row.bidSize / maxDepth) * 100) : 0;
        row.askDepthPercent = maxDepth > 0 ? Math.min(100, (row.askSize / maxDepth) * 100) : 0;
        row.bidPullStackPercent =
            maxPullStack > 0 ? Math.min(100, (Math.abs(row.bidPullStack) / maxPullStack) * 100) : 0;
        row.askPullStackPercent =
            maxPullStack > 0 ? Math.min(100, (Math.abs(row.askPullStack) / maxPullStack) * 100) : 0;
    }

    return rows;
};
