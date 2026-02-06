import type { EChartsOption } from 'echarts';

import { format } from 'date-fns';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useMemo, useRef } from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSSelect from '@/components/UI/CSSelect';
import CSSpinner from '@/components/UI/CSSpinner';
import ExchangeSelector from '@/components/UI/ExchangeSelector';
import { echarts } from '@/lib/echarts';
import { resizeEChart } from '@/utils/chart';
import { formatNumber } from '@/utils/number';

import { useCointegrationPairHistory } from '../api';
import { CointegrationMetric, ExchangeChartConfig, ExchangeInfo } from '../types';
import MultiSelectDrawer from './MultiSelectDrawer';

export type CointegrationPairHistoryProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    baseSymbol: string;
    comparisonSymbols: string[];
    defaultComparisonSymbols?: string[];
    metric?: CointegrationMetric;
    window: string;
    hours: string;
    hoursOptions: Record<string, string>;
    windowOptions: Record<string, string>;
    symbolOptions: string[];
    onRemoveClick: () => void;
    onExchangeChange: (exchange: string) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const metricOptions: Record<string, CointegrationMetric> = {
    'Spread Z': CointegrationMetric.SpreadZ,
    'Half-life': CointegrationMetric.HalfLife,
    'ADF t': CointegrationMetric.AdfT,
    'Hedge Ratio': CointegrationMetric.HedgeRatio,
    'Spread Std': CointegrationMetric.SpreadStd,
};

const metricDecimals: Record<CointegrationMetric, number> = {
    [CointegrationMetric.SpreadZ]: 3,
    [CointegrationMetric.HalfLife]: 2,
    [CointegrationMetric.AdfT]: 3,
    [CointegrationMetric.HedgeRatio]: 3,
    [CointegrationMetric.SpreadStd]: 3,
};

const sanitizeComparisonSymbols = (symbols: string[], baseSymbol: string) =>
    symbols.filter((symbol) => symbol && symbol !== baseSymbol);

const CointegrationPairHistory = (props: CointegrationPairHistoryProps) => {
    const {
        exchange,
        exchanges,
        baseSymbol,
        comparisonSymbols,
        defaultComparisonSymbols,
        metric,
        window,
        hours,
        hoursOptions,
        windowOptions,
        symbolOptions,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);

    const defaultWindow = Object.values(windowOptions)[0];
    const defaultHours = Object.values(hoursOptions)[0];

    const resolvedBaseSymbol = baseSymbol || symbolOptions[0] || '';
    const resolvedComparisonSymbols = sanitizeComparisonSymbols(comparisonSymbols, resolvedBaseSymbol);
    const resolvedWindow = window || defaultWindow;
    const resolvedHours = hours || defaultHours;
    const resolvedMetric = metric || CointegrationMetric.SpreadZ;

    const isReady = Boolean(
        resolvedBaseSymbol && resolvedComparisonSymbols.length > 0 && resolvedWindow && resolvedHours,
    );

    const cointegrationHistory = useCointegrationPairHistory({
        exchange,
        baseSymbol: resolvedBaseSymbol,
        comparisonSymbols: resolvedComparisonSymbols,
        window: resolvedWindow,
        hours: resolvedHours,
        metric: resolvedMetric,
    });

    const seriesData = cointegrationHistory.data?.history ?? [];
    const hasSeriesData = seriesData.some((series) => series.length > 0);

    const option: EChartsOption = useMemo(
        () => ({
            grid: {
                bottom: '40',
                left: '55',
                right: '20',
                top: '15',
            },
            series: seriesData.map((data, index) => ({
                data,
                smooth: true,
                type: 'line',
                symbol: 'circle',
                name: resolvedComparisonSymbols[index] || `Series ${index + 1}`,
            })),
            tooltip: {
                axisPointer: {
                    type: 'line',
                },
                trigger: 'axis',
                formatter: (params: any) => {
                    if (!params?.length) return '';
                    const date = new Date(params[0].value?.[0]);
                    const timestamp = Number.isNaN(date.getTime()) ? '' : format(date, 'M/d/yyyy h:mm a');
                    const lines = params.map((point: any) => {
                        const value = point.value?.[1];
                        const valueText =
                            value === null || value === undefined
                                ? '-'
                                : formatNumber(Number(value), {
                                      maximumFractionDigits: metricDecimals[resolvedMetric] ?? 3,
                                  });
                        return `${point.marker}${point.seriesName}: <strong>${valueText}</strong>`;
                    });
                    return `${timestamp}<br/>${lines.join('<br/>')}`;
                },
            },
            xAxis: {
                axisLabel: {
                    formatter: (value: number) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(
                            date.getMinutes(),
                        ).padStart(2, '0')}`;
                    },
                },
                splitLine: {
                    lineStyle: {
                        color: '#1e293b',
                    },
                },
                type: 'time',
            },
            yAxis: {
                axisLabel: {
                    formatter: (value: number) =>
                        formatNumber(value, { maximumFractionDigits: metricDecimals[resolvedMetric] ?? 3 }),
                },
                splitLine: {
                    lineStyle: {
                        color: '#334155',
                    },
                },
                type: 'value',
            },
        }),
        [seriesData, resolvedComparisonSymbols, resolvedMetric],
    );

    const handleBaseSymbolChange = (nextSymbol: string) => {
        if (resolvedComparisonSymbols.includes(nextSymbol)) {
            const sanitized = resolvedComparisonSymbols.filter((symbol) => symbol !== nextSymbol);
            onConfigChange({ baseSymbol: nextSymbol, comparisonSymbols: sanitized });
            return;
        }
        onConfigChange({ baseSymbol: nextSymbol });
    };

    const controls = (
        <>
            <CSSelect<string>
                classes="w-32"
                onChange={handleBaseSymbolChange}
                options={symbolOptions}
                value={resolvedBaseSymbol}
            />
            <MultiSelectDrawer
                classes="w-36"
                defaultValue={defaultComparisonSymbols}
                maxSelected={32}
                onChange={(nextSymbols) => {
                    onConfigChange({
                        comparisonSymbols: sanitizeComparisonSymbols(nextSymbols, resolvedBaseSymbol),
                    });
                }}
                options={symbolOptions}
                title="Select comparison symbols"
                value={resolvedComparisonSymbols}
            />
            <CSSelect<string>
                classes="w-28"
                onChange={(nextWindow) => onConfigChange({ window: nextWindow })}
                options={windowOptions}
                value={resolvedWindow}
            />
            <CSSelect<string>
                classes="w-28"
                onChange={(nextHours) => onConfigChange({ hours: nextHours })}
                options={hoursOptions}
                value={resolvedHours}
            />
            <CSSelect<CointegrationMetric>
                classes="w-36"
                onChange={(nextMetric) => onConfigChange({ cointegrationMetric: nextMetric })}
                options={metricOptions}
                value={resolvedMetric}
            />
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title="Cointegration Pair History">
            <div className="relative h-[calc(100%-40px)]">
                {isReady && cointegrationHistory.isLoading && <CSSpinner />}

                {!isReady && (
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">
                        Select a base symbol and comparison symbols to load history.
                    </div>
                )}

                {isReady && !cointegrationHistory.isError && !hasSeriesData && !cointegrationHistory.isLoading && (
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">
                        No cointegration history available for these pairs.
                    </div>
                )}

                {isReady && !cointegrationHistory.isError && hasSeriesData && (
                    <ReactEChartsCore
                        echarts={echarts}
                        notMerge={true}
                        onChartReady={() => resizeEChart(chartRef)}
                        option={option}
                        ref={chartRef}
                        style={{ height: '100%', width: '100%' }}
                    />
                )}
            </div>
        </ChartContainer>
    );
};

export default CointegrationPairHistory;
