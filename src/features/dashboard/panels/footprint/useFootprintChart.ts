import {
    ColorType,
    CrosshairMode,
    createChart,
    type IChartApi,
    type ISeriesApi,
    type LogicalRange,
    type MouseEventParams,
    type Time,
    type WhitespaceData,
} from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';

import { palette, TERMINAL_FONT } from '@/lib/theme';

import type { ChartBar } from './types';

import {
    FootprintSeries,
    toFootprintSeriesData,
    type FootprintSeriesData,
    type FootprintSeriesPoint,
} from './FootprintSeries';

type FootprintSeriesApi = ISeriesApi<'Custom', Time, FootprintSeriesData | WhitespaceData<Time>>;

type Options = {
    bars: ChartBar[];
    currentTickSize: string | undefined;
    hasMore: boolean;
    loadOlder: () => Promise<void>;
    marketKey: string | undefined;
    scopeKey: string;
    ticksPerRow: number;
};

const pricePrecision = (tickSize: string): number => {
    const decimal = tickSize.split('.')[1];
    return decimal?.replace(/0+$/, '').length ?? 0;
};

const isFootprintData = (point: FootprintSeriesPoint | undefined): point is FootprintSeriesData =>
    Boolean(point && 'open' in point);

export const formatChartCoordinateLabel = (coordinate: number, timestamps: ReadonlyMap<number, number>): string => {
    const timestampMs = timestamps.get(coordinate);
    if (timestampMs === undefined) return `#${coordinate}`;
    const iso = new Date(timestampMs).toISOString();
    return `${iso.slice(5, 10)} ${iso.slice(11, 19)}`;
};

const useFootprintChart = ({
    bars,
    currentTickSize,
    hasMore,
    loadOlder,
    marketKey,
    scopeKey,
    ticksPerRow,
}: Options) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<FootprintSeriesApi | null>(null);
    const pointsRef = useRef(new Map<number, FootprintSeriesData>());
    const timestampsRef = useRef(new Map<number, number>());
    const crosshairTimeRef = useRef<number | null>(null);
    const activeScopeRef = useRef('');
    const barCountRef = useRef(0);
    const hasMoreRef = useRef(hasMore);
    const loadOlderRef = useRef(loadOlder);
    const [legendBar, setLegendBar] = useState<FootprintSeriesData | null>(null);
    hasMoreRef.current = hasMore;
    loadOlderRef.current = loadOlder;

    useEffect(() => {
        const element = wrapRef.current;
        crosshairTimeRef.current = null;
        setLegendBar(null);
        if (!element || !marketKey) return;

        const tickSize = Number(currentTickSize ?? '1');
        const formatChartTime = (time: Time) => formatChartCoordinateLabel(Number(time), timestampsRef.current);
        const chart = createChart(element, {
            autoSize: true,
            crosshair: { mode: CrosshairMode.Normal },
            grid: {
                horzLines: { visible: false },
                vertLines: { visible: false },
            },
            layout: {
                attributionLogo: true,
                background: { color: palette.bgInset, type: ColorType.Solid },
                fontFamily: TERMINAL_FONT,
                fontSize: 10,
                textColor: palette.fgDim,
            },
            localization: { timeFormatter: formatChartTime },
            rightPriceScale: {
                borderColor: palette.bdHi,
                minimumWidth: 70,
                scaleMargins: { bottom: 0.08, top: 0.08 },
            },
            timeScale: {
                barSpacing: 56,
                borderColor: palette.bdHi,
                minBarSpacing: 3,
                rightOffset: 2,
                secondsVisible: false,
                tickMarkFormatter: formatChartTime,
                timeVisible: true,
            },
        });
        const series = chart.addCustomSeries(new FootprintSeries(), {
            priceFormat: {
                minMove: tickSize,
                precision: pricePrecision(currentTickSize ?? '1'),
                type: 'price',
            },
        });
        chartRef.current = chart;
        seriesRef.current = series;

        const handleCrosshairMove = (param: MouseEventParams<Time>) => {
            const point = param.seriesData.get(series) as FootprintSeriesPoint | undefined;
            if (isFootprintData(point)) {
                const pointTime = Number(point.time);
                if (crosshairTimeRef.current === pointTime) return;
                crosshairTimeRef.current = pointTime;
                setLegendBar(point);
                return;
            }
            if (crosshairTimeRef.current === null) return;
            crosshairTimeRef.current = null;
            setLegendBar([...pointsRef.current.values()].at(-1) ?? null);
        };
        const handleVisibleRangeChange = (range: LogicalRange | null) => {
            if (range && range.from < 20 && hasMoreRef.current) void loadOlderRef.current();
        };

        chart.subscribeCrosshairMove(handleCrosshairMove);
        chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
        return () => {
            chart.unsubscribeCrosshairMove(handleCrosshairMove);
            chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
        };
    }, [marketKey]);

    useEffect(() => {
        if (!seriesRef.current || !currentTickSize) return;
        seriesRef.current.applyOptions({
            priceFormat: {
                minMove: Number(currentTickSize),
                precision: pricePrecision(currentTickSize),
                type: 'price',
            },
        });
    }, [currentTickSize]);

    useEffect(() => {
        const chart = chartRef.current;
        const series = seriesRef.current;
        if (!chart || !series || !marketKey) return;

        const scopeChanged = activeScopeRef.current !== scopeKey;
        const previousBarCount = barCountRef.current;
        const points = bars.map((bar) => toFootprintSeriesData(bar, ticksPerRow));

        if (scopeChanged) crosshairTimeRef.current = null;
        activeScopeRef.current = scopeKey;
        barCountRef.current = bars.length;
        pointsRef.current = new Map(points.map((point) => [Number(point.time), point]));
        timestampsRef.current = new Map(bars.map((bar) => [bar.barIndex, bar.openedAtMs]));
        series.setData(points);

        const latest = points.at(-1) ?? null;
        const selected =
            crosshairTimeRef.current === null ? undefined : pointsRef.current.get(crosshairTimeRef.current);
        setLegendBar(selected ?? latest);
        if (bars.length === 0) return;

        if (scopeChanged || previousBarCount === 0) {
            const lastIndex = bars.length - 1;
            chart.timeScale().setVisibleLogicalRange({
                from: Math.max(0, lastIndex - 14),
                to: lastIndex + 2,
            });
        }
    }, [bars, marketKey, scopeKey, ticksPerRow]);

    return { legendBar, wrapRef };
};

export default useFootprintChart;
