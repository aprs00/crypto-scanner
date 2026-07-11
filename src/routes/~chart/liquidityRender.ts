import { format } from 'date-fns';

import { TERMINAL_FONT, palette, withAlpha } from '@/lib/theme';
import { formatNumber, formatPrice } from '@/utils/number';

import {
    LIQUIDITY_BUCKETS_PER_SIDE,
    LiquiditySide,
    type LiquiditySide as LiquiditySideType,
    type LiquidityTimeline,
} from './liquidityModel';
import { niceBucket } from './tickChartMath';
import { LiquidityContrast, type LiquidityPreferences, LiquidityIntensity } from './useChartSeriesStore';

export type LiquidityViewport = {
    endT: number;
    follow: boolean;
    mainH: number;
    mainTop: number;
    plotLeft: number;
    plotW: number;
    priceDec: number;
    priceHi: number;
    priceLo: number;
    spanMs: number;
    startT: number;
    tickSize: number;
};

type Cell = {
    end: number;
    notional: number;
    openRight: boolean;
    priceHi: number;
    priceLo: number;
    price: number;
    rowId: number;
    side: LiquiditySideType;
    start: number;
    visual: number;
};

type LiquidityRaster = {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    endT: number;
    height: number;
    imageData: ImageData;
    peaks: Uint8Array;
    width: number;
};

export type PreparedLiquidity = {
    cells: Cell[];
    raster: LiquidityRaster | null;
};

const EMPTY_PREPARED: PreparedLiquidity = { cells: [], raster: null };

const stableInteger = (value: number): number | null => {
    const rounded = Math.round(value);
    const tolerance = Math.min(0.001, Math.max(1, Math.abs(value)) * Number.EPSILON * 16);
    return Math.abs(value - rounded) <= tolerance ? rounded : null;
};

const stableCeil = (value: number): number => stableInteger(value) ?? Math.ceil(value);
const stableFloor = (value: number): number => stableInteger(value) ?? Math.floor(value);

const intensityBoost = (value: LiquidityIntensity): number =>
    value === LiquidityIntensity.Low ? 0.75 : value === LiquidityIntensity.High ? 1.45 : 1;

const contrastPower = (value: LiquidityContrast): number =>
    value === LiquidityContrast.Soft ? 0.35 : value === LiquidityContrast.Sharp ? 0.82 : 0.5;

const heatColor = (visual: number): string => {
    const color = visual < 0.28 ? '#3b82c4' : visual < 0.58 ? '#ff9e1f' : visual < 0.84 ? '#e8413f' : '#ffe26e';
    return withAlpha(color, Math.min(0.82, 0.1 + 0.72 * visual));
};

const reduceForPixels = (
    runs: Cell[],
    viewport: LiquidityViewport,
    intervalCount: number,
    rowStride: number,
): Cell[] => {
    if (intervalCount <= Math.max(1, Math.floor(viewport.plotW))) return runs;
    const binMs = viewport.spanMs / Math.max(1, Math.floor(viewport.plotW));
    const retained: Cell[] = [];
    const bins = new Map<number, Cell>();

    for (const run of runs) {
        if (run.end - run.start >= binMs) {
            retained.push(run);
            continue;
        }
        const bin = Math.floor((run.start - viewport.startT) / binMs);
        const key = bin * rowStride + run.rowId;
        const current = bins.get(key);
        if (
            !current ||
            run.notional > current.notional ||
            (run.notional === current.notional && run.end - run.start > current.end - current.start)
        )
            bins.set(key, run);
    }

    for (const cell of bins.values()) retained.push(cell);
    return retained;
};

const prepare = (
    timeline: LiquidityTimeline,
    viewport: LiquidityViewport,
    preferences: LiquidityPreferences,
): PreparedLiquidity => {
    if (
        timeline.count === 0 ||
        !(timeline.sampleBucketTicks > 0) ||
        !(timeline.sampleTickSize > 0) ||
        !(viewport.priceHi > viewport.priceLo) ||
        !(viewport.mainH > 0) ||
        !(viewport.plotW > 0)
    )
        return EMPTY_PREPARED;

    const priceSpan = viewport.priceHi - viewport.priceLo;
    const targetRows = Math.max(1, viewport.mainH / 4);
    const targetWidth = priceSpan / targetRows;
    const niceWidth = niceBucket(targetWidth, viewport.tickSize);
    const displayTicks = Math.max(timeline.sampleBucketTicks, Math.round(niceWidth / viewport.tickSize));
    if (!(displayTicks > 0)) return EMPTY_PREPARED;

    const storageTicks = timeline.sampleBucketTicks;
    const tickSize = timeline.sampleTickSize;
    const storageWidth = storageTicks * tickSize;
    const displayWidth = displayTicks * tickSize;
    if (!(storageWidth > 0) || !(displayWidth > 0)) return EMPTY_PREPARED;

    // Two rows of slack cover the opposite bid/ask interval edges while keeping
    // scratch work bounded by visible vertical pixels rather than book depth.
    const minDisplay = stableFloor(viewport.priceLo / displayWidth) - 2;
    const maxDisplay = stableCeil(viewport.priceHi / displayWidth) + 2;
    const rowCount = maxDisplay - minDisplay + 1;
    if (!Number.isSafeInteger(rowCount) || rowCount <= 0) return EMPTY_PREPARED;
    const totalRows = rowCount * 2;
    const totals = new Float64Array(totalRows);
    const activeNotionals = new Float64Array(totalRows);
    const activeStarts = new Float64Array(totalRows);
    const activeEnds = new Float64Array(totalRows);
    const active = new Uint8Array(totalRows);

    const minStorage = Math.floor((viewport.priceLo - displayWidth) / storageWidth) - 1;
    const maxStorage = Math.ceil((viewport.priceHi + displayWidth) / storageWidth) + 1;
    const runs: Cell[] = [];
    let intervalCount = 0;

    const pushRun = (rowId: number) => {
        const ask = rowId >= rowCount;
        const displayIndex = minDisplay + (rowId % rowCount);
        const price = displayIndex * displayWidth;
        runs.push({
            end: activeEnds[rowId],
            notional: activeNotionals[rowId],
            openRight: activeEnds[rowId] === viewport.endT,
            price,
            priceHi: ask ? price : price + displayWidth,
            priceLo: ask ? price - displayWidth : price,
            rowId,
            side: ask ? LiquiditySide.Ask : LiquiditySide.Bid,
            start: activeStarts[rowId],
            visual: 0,
        });
    };

    timeline.forEachInterval(viewport.startT, viewport.endT, (sample, start, end) => {
        intervalCount++;
        totals.fill(0);

        const addSide = (ask: boolean) => {
            const anchor = ask ? sample.askAnchor : sample.bidAnchor;
            const slotStart = Math.max(0, ask ? minStorage - anchor : anchor - maxStorage);
            const slotEnd = Math.min(LIQUIDITY_BUCKETS_PER_SIDE - 1, ask ? maxStorage - anchor : anchor - minStorage);
            const valueOffset = sample.offset + (ask ? LIQUIDITY_BUCKETS_PER_SIDE : 0);

            for (let slot = slotStart; slot <= slotEnd; slot++) {
                const notional = sample.values[valueOffset + slot];
                if (!(notional > 0)) continue;
                const storageIndex = ask ? anchor + slot : anchor - slot;
                const absoluteTicks = storageIndex * storageTicks;
                const displayIndex = ask
                    ? stableCeil(absoluteTicks / displayTicks)
                    : stableFloor(absoluteTicks / displayTicks);
                const visibleRow = displayIndex - minDisplay;
                if (visibleRow < 0 || visibleRow >= rowCount) continue;
                totals[visibleRow + (ask ? rowCount : 0)] += notional;
            }
        };

        addSide(false);
        addSide(true);
        for (let rowId = 0; rowId < totalRows; rowId++) {
            const notional = totals[rowId];
            const visible = Number.isFinite(notional) && notional > 0 && notional >= preferences.minNotional;
            if (!visible) {
                if (active[rowId]) pushRun(rowId);
                active[rowId] = 0;
                continue;
            }
            if (active[rowId] && activeNotionals[rowId] === notional && Math.abs(activeEnds[rowId] - start) < 0.01) {
                activeEnds[rowId] = end;
                continue;
            }
            if (active[rowId]) pushRun(rowId);
            active[rowId] = 1;
            activeNotionals[rowId] = notional;
            activeStarts[rowId] = start;
            activeEnds[rowId] = end;
        }
    });
    for (let rowId = 0; rowId < totalRows; rowId++) if (active[rowId]) pushRun(rowId);

    const cells = reduceForPixels(runs, viewport, intervalCount, totalRows);
    let visibleMaximum = 0;
    for (const cell of cells) if (cell.notional > visibleMaximum) visibleMaximum = cell.notional;
    if (!(visibleMaximum > 0)) return EMPTY_PREPARED;

    const boost = intensityBoost(preferences.intensity);
    const power = contrastPower(preferences.contrast);
    const visibleCells: Cell[] = [];
    for (const cell of cells) {
        cell.visual = Math.min(1, (cell.notional / visibleMaximum) ** power * boost);
        if (cell.visual > 0.04) visibleCells.push(cell);
    }
    return { cells: visibleCells, raster: null };
};

type LiquidityPaintContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const paintLiquidityCells = (ctx: LiquidityPaintContext, cells: readonly Cell[], viewport: LiquidityViewport): void => {
    const plotRight = viewport.plotLeft + viewport.plotW;
    for (const cell of cells) {
        const left = Math.max(viewport.plotLeft, xFor(viewport, cell.start));
        const end = cell.openRight ? viewport.endT : cell.end;
        const right = Math.min(plotRight, xFor(viewport, end));
        if (!(right > left)) continue;
        const top = yFor(viewport, cell.priceHi);
        const bottom = yFor(viewport, cell.priceLo);
        if (bottom < viewport.mainTop || top > viewport.mainTop + viewport.mainH) continue;
        ctx.fillStyle = heatColor(cell.visual);
        ctx.fillRect(left, top, right - left, Math.max(0.5, bottom - top));
    }
};

const rasterizeLiquidity = (
    ctx: LiquidityPaintContext,
    prepared: PreparedLiquidity,
    viewport: LiquidityViewport,
    width: number,
    height: number,
    scaleX: number,
    scaleY: number,
    peaks: Uint8Array,
    image: ImageData,
): void => {
    // Peak intensity per raster pixel bounds both work and memory by the raster
    // dimensions. It also preserves sub-pixel walls that would otherwise disappear
    // when several historical runs collapse into one screen column.
    peaks.fill(0);
    const plotRight = viewport.plotLeft + viewport.plotW;
    const plotBottom = viewport.mainTop + viewport.mainH;
    for (const cell of prepared.cells) {
        const left = Math.max(viewport.plotLeft, xFor(viewport, cell.start));
        const end = cell.openRight ? viewport.endT : cell.end;
        const right = Math.min(plotRight, xFor(viewport, end));
        if (!(right > left)) continue;
        const top = Math.max(viewport.mainTop, yFor(viewport, cell.priceHi));
        const bottom = Math.min(plotBottom, yFor(viewport, cell.priceLo));
        if (!(bottom > top)) continue;

        const x0 = Math.max(0, Math.floor((left - viewport.plotLeft) * scaleX));
        const x1 = Math.min(width, Math.max(x0 + 1, Math.ceil((right - viewport.plotLeft) * scaleX)));
        const y0 = Math.max(0, Math.floor((top - viewport.mainTop) * scaleY));
        const y1 = Math.min(height, Math.max(y0 + 1, Math.ceil((bottom - viewport.mainTop) * scaleY)));
        const visual = Math.max(1, Math.min(255, Math.round(cell.visual * 255)));
        for (let y = y0; y < y1; y++) {
            let offset = y * width + x0;
            const endOffset = y * width + x1;
            for (; offset < endOffset; offset++) if (visual > peaks[offset]) peaks[offset] = visual;
        }
    }

    const pixels = image.data;
    pixels.fill(0);
    for (let index = 0; index < peaks.length; index++) {
        const peak = peaks[index];
        if (peak === 0) continue;
        const visual = peak / 255;
        const offset = index * 4;
        if (visual < 0.28) {
            pixels[offset] = 59;
            pixels[offset + 1] = 130;
            pixels[offset + 2] = 196;
        } else if (visual < 0.58) {
            pixels[offset] = 255;
            pixels[offset + 1] = 158;
            pixels[offset + 2] = 31;
        } else if (visual < 0.84) {
            pixels[offset] = 232;
            pixels[offset + 1] = 65;
            pixels[offset + 2] = 63;
        } else {
            pixels[offset] = 255;
            pixels[offset + 1] = 226;
            pixels[offset + 2] = 110;
        }
        pixels[offset + 3] = Math.round(Math.min(0.82, 0.1 + 0.72 * visual) * 255);
    }
    ctx.putImageData(image, 0, 0);
};

const createLiquidityRaster = (
    prepared: PreparedLiquidity,
    viewport: LiquidityViewport,
    previous: LiquidityRaster | null,
): LiquidityRaster | null => {
    if (prepared.cells.length === 0) return null;
    // Liquidity is already quantized to visible rows and columns, so one raster
    // sample per CSS pixel is sufficient even when the destination canvas is HiDPI.
    const width = Math.max(1, Math.ceil(viewport.plotW));
    const height = Math.max(1, Math.ceil(viewport.mainH));
    const scaleX = width / viewport.plotW;
    const scaleY = height / viewport.mainH;

    let canvas: HTMLCanvasElement | OffscreenCanvas;
    if (previous && previous.width === width && previous.height === height) {
        canvas = previous.canvas;
    } else if (typeof OffscreenCanvas !== 'undefined') {
        canvas = new OffscreenCanvas(width, height);
    } else {
        if (typeof document === 'undefined') return null;
        const element = document.createElement('canvas');
        element.width = width;
        element.height = height;
        canvas = element;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const peaks =
        previous?.width === width && previous.height === height ? previous.peaks : new Uint8Array(width * height);
    const imageData =
        previous?.width === width && previous.height === height
            ? previous.imageData
            : ctx.createImageData(width, height);
    rasterizeLiquidity(ctx, prepared, viewport, width, height, scaleX, scaleY, peaks, imageData);
    return { canvas, endT: viewport.endT, height, imageData, peaks, width };
};

export class LiquidityRenderCache {
    private key = '';
    private prepared: PreparedLiquidity = EMPTY_PREPARED;

    get(
        timeline: LiquidityTimeline,
        viewport: LiquidityViewport,
        preferences: LiquidityPreferences,
    ): PreparedLiquidity {
        const pixelMs = viewport.spanMs / Math.max(1, viewport.plotW);
        const timeKey = viewport.follow ? Math.floor(viewport.endT / Math.max(1, pixelMs)) : viewport.endT;
        const key = [
            timeline.version,
            timeKey,
            viewport.plotW,
            viewport.mainH,
            viewport.priceLo,
            viewport.priceHi,
            viewport.tickSize,
            preferences.intensity,
            preferences.contrast,
            preferences.minNotional,
        ].join('|');
        if (key !== this.key) {
            this.key = key;
            const previousRaster = this.prepared.raster;
            this.prepared = prepare(timeline, viewport, preferences);
            this.prepared.raster = createLiquidityRaster(this.prepared, viewport, previousRaster);
        }
        return this.prepared;
    }

    clear(): void {
        this.key = '';
        this.prepared = EMPTY_PREPARED;
    }
}

const xFor = (viewport: LiquidityViewport, time: number): number =>
    viewport.plotLeft + ((time - viewport.startT) / viewport.spanMs) * viewport.plotW;

const yFor = (viewport: LiquidityViewport, price: number): number =>
    viewport.mainTop + (1 - (price - viewport.priceLo) / (viewport.priceHi - viewport.priceLo)) * viewport.mainH;

export const drawLiquidity = (
    ctx: CanvasRenderingContext2D,
    prepared: PreparedLiquidity,
    viewport: LiquidityViewport,
): void => {
    const plotRight = viewport.plotLeft + viewport.plotW;
    ctx.save();
    ctx.beginPath();
    ctx.rect(viewport.plotLeft, viewport.mainTop, viewport.plotW, viewport.mainH);
    ctx.clip();
    const raster = prepared.raster;
    if (!raster) {
        paintLiquidityCells(ctx, prepared.cells, viewport);
        ctx.restore();
        return;
    }

    // The prepared key advances once per horizontal pixel while following. Between
    // keys, shift the cached bitmap by the sub-pixel time delta and extend its edge
    // column, which represents the still-open rightmost liquidity intervals.
    const deltaPx = ((viewport.endT - raster.endT) / viewport.spanMs) * viewport.plotW;
    const rasterLeft = viewport.plotLeft - deltaPx;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(raster.canvas, rasterLeft, viewport.mainTop, viewport.plotW, viewport.mainH);
    if (deltaPx > 0) {
        const sourceW = 1;
        ctx.drawImage(
            raster.canvas,
            raster.width - sourceW,
            0,
            sourceW,
            raster.height,
            plotRight - deltaPx,
            viewport.mainTop,
            deltaPx,
            viewport.mainH,
        );
    } else if (deltaPx < 0) {
        const sourceW = 1;
        ctx.drawImage(
            raster.canvas,
            0,
            0,
            sourceW,
            raster.height,
            viewport.plotLeft,
            viewport.mainTop,
            -deltaPx,
            viewport.mainH,
        );
    }
    ctx.restore();
};

const compactDollars = (value: number): string =>
    `$${formatNumber(value, {
        maximumFractionDigits: value < 10_000 ? 0 : 1,
        notation: value >= 1_000 ? 'compact' : 'standard',
    })}`;

export const drawLiquidityTooltip = (
    ctx: CanvasRenderingContext2D,
    prepared: PreparedLiquidity,
    viewport: LiquidityViewport,
    hover: { x: number; y: number },
): void => {
    const plotRight = viewport.plotLeft + viewport.plotW;
    const plotBottom = viewport.mainTop + viewport.mainH;
    if (hover.x < viewport.plotLeft || hover.x > plotRight || hover.y < viewport.mainTop || hover.y > plotBottom)
        return;

    const time = viewport.startT + ((hover.x - viewport.plotLeft) / viewport.plotW) * viewport.spanMs;
    const price =
        viewport.priceLo + (1 - (hover.y - viewport.mainTop) / viewport.mainH) * (viewport.priceHi - viewport.priceLo);
    let hit: Cell | null = null;
    for (const cell of prepared.cells) {
        const end = cell.openRight ? viewport.endT : cell.end;
        if (time < cell.start || time >= end || price < cell.priceLo || price > cell.priceHi) continue;
        if (!hit || cell.notional > hit.notional) hit = cell;
    }
    if (!hit) return;

    const sideColor = hit.side === LiquiditySide.Bid ? palette.up : palette.down;
    const intervalEnd = hit.openRight ? viewport.endT : hit.end;
    const lines = [
        `LIQ ${hit.side.toUpperCase()}`,
        `${format(hit.start, 'HH:mm:ss')}–${format(intervalEnd, 'HH:mm:ss')}`,
        `${formatPrice(hit.price, viewport.priceDec)}  ${compactDollars(hit.notional)}`,
        `${Math.round(hit.visual * 100)}% visual intensity`,
    ];
    ctx.save();
    ctx.font = `9px ${TERMINAL_FONT}`;
    let width = 0;
    for (const line of lines) width = Math.max(width, ctx.measureText(line).width);
    width += 12;
    const height = 55;
    let left = hover.x + 10;
    if (left + width > plotRight) left = hover.x - width - 10;
    left = Math.max(viewport.plotLeft + 2, Math.min(plotRight - width - 2, left));
    let top = hover.y - height - 8;
    if (top < viewport.mainTop + 2) top = hover.y + 8;
    top = Math.max(viewport.mainTop + 2, Math.min(plotBottom - height - 2, top));

    ctx.fillStyle = withAlpha(palette.bg, 0.94);
    ctx.fillRect(left, top, width, height);
    ctx.strokeStyle = sideColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let index = 0; index < lines.length; index++) {
        ctx.fillStyle = index === 0 ? sideColor : index === 3 ? palette.fgDim : palette.fg;
        ctx.fillText(lines[index], left + 6, top + 5 + index * 12);
    }
    ctx.restore();
};
