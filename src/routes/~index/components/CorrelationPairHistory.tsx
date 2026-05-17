import type { EChartsOption } from 'echarts';

import { format, subMinutes } from 'date-fns';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useRef } from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';
import { echarts, ECHARTS_THEME } from '@/lib/echarts';
import { resizeEChart } from '@/utils/chart';

import { useCorrelationPairHistory } from '../api';
import { ChartType, DataType, ExchangeChartConfig, ExchangeInfo } from '../types';
import MultiSelectDrawer from './MultiSelectDrawer';

export type CorrelationPairHistoryProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    baseSymbol: string;
    comparisonSymbols: string[];
    defaultComparisonSymbols?: string[];
    dataType: DataType;
    hours: string;
    hoursOptions: Record<string, string>;
    typeOptions: Array<DataType>;
    symbolOptions: string[];
    onRemoveClick: () => void;
    onExchangeChange: (exchange: string) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const CorrelationPairHistory = (props: CorrelationPairHistoryProps) => {
    const {
        exchange,
        exchanges,
        baseSymbol,
        comparisonSymbols,
        defaultComparisonSymbols,
        dataType,
        hours,
        hoursOptions,
        typeOptions,
        symbolOptions,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);

    const correlationPairHistory = useCorrelationPairHistory({
        exchange,
        baseSymbol,
        comparisonSymbols,
        type: dataType,
        hours,
    });

    const option: EChartsOption = {
        grid: { bottom: '0', left: '40', right: '0', top: '50' },
        legend: { top: 4, type: 'scroll' },
        series:
            correlationPairHistory.data?.history.map((data, index) => ({
                name: comparisonSymbols[index],
                data: data,
                smooth: true,
                type: 'line',
                symbol: 'circle',
                visible: false,
            })) || [],
        tooltip: {
            axisPointer: { type: 'line' },
            formatter: (params: any) => {
                const date = format(subMinutes(new Date(params[0].value[0]), 1), 'M/d/yyyy h:mm a');
                const lines = [...params]
                    .sort((a, b) => Number(b.value?.[1]) - Number(a.value?.[1]))
                    .map((param: any) => `${param.marker}${param.seriesName}: <strong>${param.value[1]}</strong>`)
                    .join('<br/>');
                return `${date}<br/>${lines}`;
            },
            trigger: 'axis',
        },
        xAxis: {
            axisLabel: {
                formatter: (value: number) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                },
            },
            type: 'time',
        },
        yAxis: { max: 1, min: -1, type: 'value' },
    };

    const controls = (
        <>
            <CSSelect<string>
                classes="w-32"
                onChange={(baseSymbol) => {
                    onConfigChange({ baseSymbol });
                }}
                options={symbolOptions}
                value={baseSymbol}
            />
            <MultiSelectDrawer
                classes="w-32"
                defaultValue={defaultComparisonSymbols}
                maxSelected={32}
                onChange={(comparisonSymbols) => {
                    onConfigChange({ comparisonSymbols });
                }}
                options={symbolOptions}
                title="Select comparison symbols"
                value={comparisonSymbols}
            />
            <CSSelect<string>
                onChange={(hours) => {
                    onConfigChange({ hours });
                }}
                options={hoursOptions}
                value={hours}
            />
            <CSSelect<DataType>
                classes="w-24"
                onChange={(dataType) => {
                    onConfigChange({ dataType });
                }}
                options={typeOptions}
                value={dataType}
            />
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer chartType={ChartType.CorrelationPairHistory} controls={controls} onRemoveClick={onRemoveClick}>
            <ReactEChartsCore
                echarts={echarts}
                notMerge={true}
                onChartReady={() => resizeEChart(chartRef)}
                option={option}
                ref={chartRef}
                style={{ height: '92%', width: '100%' }}
                theme={ECHARTS_THEME}
            />
        </ChartContainer>
    );
};

export default CorrelationPairHistory;
