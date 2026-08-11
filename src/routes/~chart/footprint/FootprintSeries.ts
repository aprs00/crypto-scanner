import {
    customSeriesDefaultOptions,
    type CustomData,
    type CustomSeriesOptions,
    type CustomSeriesWhitespaceData,
    type ICustomSeriesPaneRenderer,
    type ICustomSeriesPaneView,
    type PaneRendererCustomData,
    type Time,
    type UTCTimestamp,
} from 'lightweight-charts';

import { palette, TERMINAL_FONT, withAlpha } from '@/lib/theme';

import type { ChartBar } from './types';

type FootprintSeriesLevel = {
    buyQuantity: number;
    price: number;
    sellQuantity: number;
};

export interface FootprintSeriesData extends CustomData<Time> {
    buyQuantity: number;
    breakBefore: boolean;
    close: number;
    high: number;
    levels: FootprintSeriesLevel[];
    low: number;
    open: number;
    quantityPrecision: number;
    rowSize: number;
    sellQuantity: number;
    tickSize: number;
    tradeCount: number;
}

export type FootprintSeriesPoint = FootprintSeriesData | CustomSeriesWhitespaceData<Time>;

export const formatFootprintQuantity = (quantity: number, precision: number): string => {
    const fixed = quantity.toFixed(precision);
    return fixed.includes('.') ? fixed.replace(/0+$/u, '').replace(/\.$/u, '') : fixed;
};

const drawCandle = (
    context: CanvasRenderingContext2D,
    item: FootprintSeriesData,
    x: number,
    width: number,
    priceConverter: Parameters<ICustomSeriesPaneRenderer['draw']>[1],
) => {
    const highY = priceConverter(item.high);
    const lowY = priceConverter(item.low);
    const openY = priceConverter(item.open);
    const closeY = priceConverter(item.close);
    if (highY === null || lowY === null || openY === null || closeY === null) return;

    const rising = item.close >= item.open;
    const color = rising ? palette.up : palette.down;
    const top = Math.min(openY, closeY);
    const height = Math.max(1, Math.abs(closeY - openY));
    const bottom = top + height;
    context.save();
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(x, highY);
    context.lineTo(x, top);
    context.moveTo(x, bottom);
    context.lineTo(x, lowY);
    context.stroke();

    context.fillStyle = withAlpha(color, 0.45);
    context.fillRect(x - width / 2, top, width, height);
    context.strokeRect(x - width / 2, top, width, height);
    context.restore();
};

class FootprintPaneRenderer implements ICustomSeriesPaneRenderer {
    private data: PaneRendererCustomData<Time, FootprintSeriesData> | null = null;

    update(data: PaneRendererCustomData<Time, FootprintSeriesData>) {
        this.data = data;
    }

    draw(...args: Parameters<ICustomSeriesPaneRenderer['draw']>): void {
        const [target, priceConverter] = args;
        if (!this.data?.visibleRange) return;
        const renderData = this.data;

        target.useMediaCoordinateSpace(({ context, mediaSize }) => {
            context.save();
            context.beginPath();
            context.rect(0, 0, mediaSize.width, mediaSize.height);
            context.clip();

            const effectiveSpacing = renderData.barSpacing * renderData.conflationFactor;
            const candleWidth = Math.max(2, Math.min(12, effectiveSpacing * 0.55));
            const footprintWidth = Math.max(16, Math.min(180, effectiveSpacing * 0.88));
            const first = Math.max(0, Math.floor(renderData.visibleRange?.from ?? 0));
            const last = Math.min(renderData.bars.length, Math.ceil(renderData.visibleRange?.to ?? 0) + 1);

            for (let index = first; index < last; index += 1) {
                const bar = renderData.bars[index];
                if (!bar) continue;
                const item = bar.originalData;
                if (item.breakBefore) {
                    context.save();
                    context.setLineDash([3, 3]);
                    context.strokeStyle = palette.ac;
                    context.lineWidth = 1;
                    context.beginPath();
                    context.moveTo(bar.x - effectiveSpacing / 2, 0);
                    context.lineTo(bar.x - effectiveSpacing / 2, mediaSize.height);
                    context.stroke();
                    context.restore();
                }
                drawCandle(context, item, bar.x, candleWidth, priceConverter);
                if (effectiveSpacing < 18) continue;

                let maxQuantity = 1;
                for (const level of item.levels) {
                    maxQuantity = Math.max(maxQuantity, level.buyQuantity, level.sellQuantity);
                }
                const left = bar.x - footprintWidth / 2;
                const halfWidth = footprintWidth / 2;

                for (const level of item.levels) {
                    const firstY = priceConverter(level.price);
                    const secondY = priceConverter(level.price + item.rowSize);
                    if (firstY === null || secondY === null) continue;
                    const top = Math.min(firstY, secondY);
                    const height = Math.max(1, Math.abs(secondY - firstY));
                    if (top > mediaSize.height || top + height < 0) continue;

                    const sellAlpha = 0.08 + 0.55 * (level.sellQuantity / maxQuantity);
                    const buyAlpha = 0.08 + 0.55 * (level.buyQuantity / maxQuantity);
                    context.fillStyle = withAlpha(palette.down, sellAlpha);
                    context.fillRect(left, top, halfWidth, height);
                    context.fillStyle = withAlpha(palette.up, buyAlpha);
                    context.fillRect(bar.x, top, halfWidth, height);

                    if (effectiveSpacing >= 70 && height >= 12) {
                        context.fillStyle = palette.fg;
                        context.font = `11px ${TERMINAL_FONT}`;
                        context.textBaseline = 'middle';
                        context.textAlign = 'right';
                        context.fillText(
                            formatFootprintQuantity(level.sellQuantity, item.quantityPrecision),
                            bar.x - 3,
                            top + height / 2,
                        );
                        context.textAlign = 'left';
                        context.fillText(
                            formatFootprintQuantity(level.buyQuantity, item.quantityPrecision),
                            bar.x + 3,
                            top + height / 2,
                        );
                    }
                }
            }
            context.restore();
        });
    }
}

export class FootprintSeries implements ICustomSeriesPaneView<Time, FootprintSeriesData> {
    private readonly paneRenderer = new FootprintPaneRenderer();

    defaultOptions(): CustomSeriesOptions {
        return {
            ...customSeriesDefaultOptions,
            color: palette.ac,
            lastValueVisible: true,
            priceLineVisible: false,
        };
    }

    isWhitespace(
        data: FootprintSeriesData | CustomSeriesWhitespaceData<Time>,
    ): data is CustomSeriesWhitespaceData<Time> {
        return !('open' in data);
    }

    priceValueBuilder(data: FootprintSeriesData): number[] {
        let high = data.high;
        let low = data.low;
        for (const level of data.levels) {
            high = Math.max(high, level.price + data.rowSize);
            low = Math.min(low, level.price);
        }
        return [high, low, data.close];
    }

    renderer(): ICustomSeriesPaneRenderer {
        return this.paneRenderer;
    }

    update(data: PaneRendererCustomData<Time, FootprintSeriesData>): void {
        this.paneRenderer.update(data);
    }
}

export const rebinFootprintLevels = (bar: ChartBar, ticksPerRow: number) => {
    const rows = new Map<number, [number, number]>();
    for (const [priceTick, buyQuantity, sellQuantity] of bar.levels) {
        const rowTick = Math.floor(priceTick / ticksPerRow) * ticksPerRow;
        const row = rows.get(rowTick) ?? [0, 0];
        row[0] += buyQuantity;
        row[1] += sellQuantity;
        rows.set(rowTick, row);
    }
    return [...rows.entries()]
        .sort(([firstTick], [secondTick]) => firstTick - secondTick)
        .map(([priceTick, [buyQuantity, sellQuantity]]) => ({
            buyQuantity,
            priceTick,
            sellQuantity,
        }));
};

export const toFootprintSeriesData = (bar: ChartBar, ticksPerRow: number): FootprintSeriesData => {
    const time = bar.barIndex as UTCTimestamp;
    const tickSize = Number(bar.tickSize);
    const quantityStep = Number(bar.quantityStep);
    const rebinnedLevels = rebinFootprintLevels(bar, ticksPerRow);
    return {
        buyQuantity: bar.buyUnits * quantityStep,
        breakBefore: bar.breakBefore,
        close: bar.closeTick * tickSize,
        color: bar.closeTick >= bar.openTick ? palette.up : palette.down,
        high: bar.highTick * tickSize,
        levels: rebinnedLevels.map((level) => ({
            buyQuantity: level.buyQuantity * quantityStep,
            price: level.priceTick * tickSize,
            sellQuantity: level.sellQuantity * quantityStep,
        })),
        low: bar.lowTick * tickSize,
        open: bar.openTick * tickSize,
        quantityPrecision: bar.quantityStep.split('.')[1]?.replace(/0+$/u, '').length ?? 0,
        rowSize: tickSize * ticksPerRow,
        sellQuantity: bar.sellUnits * quantityStep,
        tickSize,
        time,
        tradeCount: bar.tradeCount,
    };
};
