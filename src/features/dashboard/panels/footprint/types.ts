import { z } from 'zod';

import { ExchangeId } from '@/services/exchanges/types';

export const ChartType = {
    Tick: 'tick',
    Trev: 'trev',
} as const;

export type ChartType = (typeof ChartType)[keyof typeof ChartType];

export const ChartSeriesStatus = {
    Building: 'building',
    CatchingUp: 'catching_up',
    Failed: 'failed',
    Queued: 'queued',
    Ready: 'ready',
} as const;

export type ChartSeriesStatus = (typeof ChartSeriesStatus)[keyof typeof ChartSeriesStatus];

export const CHART_WIRE_LIMITS = {
    barLevels: 4_000,
    httpBars: 500,
    httpLevels: 40_000,
    updateBars: 50,
    updateLevels: 8_000,
} as const;

const positiveDecimalStringSchema = z
    .string()
    .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/u)
    .refine((value) => Number(value) > 0);
const safeIntegerSchema = z.number().int().safe();
const nonnegativeSafeIntegerSchema = safeIntegerSchema.nonnegative();
const positiveSafeIntegerSchema = safeIntegerSchema.positive();

const footprintMarketSchema = z.object({
    baseAsset: z.string(),
    currentTickSize: positiveDecimalStringSchema,
    exchange: z.enum(ExchangeId),
    marketKey: z.string().min(1),
    symbol: z.string().min(1),
});

export const footprintMarketsResponseSchema = z.object({
    markets: z.array(footprintMarketSchema),
});

const footprintLevelSchema = z.tuple([
    nonnegativeSafeIntegerSchema,
    nonnegativeSafeIntegerSchema,
    nonnegativeSafeIntegerSchema,
]);

const chartBarSchema = z.object({
    barIndex: nonnegativeSafeIntegerSchema,
    breakBefore: z.boolean(),
    buyUnits: nonnegativeSafeIntegerSchema,
    closeTick: nonnegativeSafeIntegerSchema,
    highTick: nonnegativeSafeIntegerSchema,
    levels: z.array(footprintLevelSchema).max(CHART_WIRE_LIMITS.barLevels),
    lowTick: nonnegativeSafeIntegerSchema,
    openedAtMs: positiveSafeIntegerSchema,
    openTick: nonnegativeSafeIntegerSchema,
    quantityStep: positiveDecimalStringSchema,
    sellUnits: nonnegativeSafeIntegerSchema,
    tickSize: positiveDecimalStringSchema,
    tradeCount: nonnegativeSafeIntegerSchema,
});

export const chartSeriesResponseSchema = z.object({
    errorCode: z.string().min(1).nullable(),
    seriesKey: z.string().min(1),
    status: z.enum(ChartSeriesStatus),
});

const aggregateLevelCount = (bars: ChartBar[], activeBar: ChartBar | null): number =>
    bars.reduce((total, bar) => total + bar.levels.length, activeBar?.levels.length ?? 0);

export const chartBarsResponseSchema = z
    .object({
        activeBar: chartBarSchema.nullable(),
        bars: z.array(chartBarSchema).max(CHART_WIRE_LIMITS.httpBars),
        hasMore: z.boolean(),
        historyStartBarIndex: nonnegativeSafeIntegerSchema,
        nextBeforeBarIndex: nonnegativeSafeIntegerSchema.nullable(),
        seriesKey: z.string().min(1),
    })
    .superRefine((snapshot, context) => {
        if (aggregateLevelCount(snapshot.bars, snapshot.activeBar) > CHART_WIRE_LIMITS.httpLevels) {
            context.addIssue({
                code: 'custom',
                message: 'Chart snapshot contains too many footprint levels',
                path: ['bars'],
            });
        }
    });

const chartSubscribedMessageSchema = z.object({
    seriesKey: z.string().min(1),
    type: z.literal('subscribed'),
});

const chartUpdateMessageSchema = z.object({
    activeBar: chartBarSchema.nullable(),
    bars: z.array(chartBarSchema).max(CHART_WIRE_LIMITS.updateBars),
    seriesKey: z.string().min(1),
    type: z.literal('update'),
});

const chartErrorMessageSchema = z.object({
    code: z.string().min(1),
    seriesKey: z.string().min(1),
    type: z.literal('error'),
});

export const chartSocketMessageSchema = z
    .discriminatedUnion('type', [chartSubscribedMessageSchema, chartUpdateMessageSchema, chartErrorMessageSchema])
    .superRefine((message, context) => {
        if (
            message.type === 'update' &&
            aggregateLevelCount(message.bars, message.activeBar) > CHART_WIRE_LIMITS.updateLevels
        ) {
            context.addIssue({
                code: 'custom',
                message: 'Chart update contains too many footprint levels',
                path: ['bars'],
            });
        }
    });

export type FootprintMarket = z.infer<typeof footprintMarketSchema>;
export type ChartBar = z.infer<typeof chartBarSchema>;
export type ChartSeriesResponse = z.infer<typeof chartSeriesResponseSchema>;
export type ChartBarsResponse = z.infer<typeof chartBarsResponseSchema>;
export type ChartScopedMessage = z.infer<typeof chartSocketMessageSchema>;
