import type { EChartsOption } from 'echarts';

import { format, subMinutes } from 'date-fns';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useRef } from 'react';

import ChartContainer, { ComponentName } from '@/components/Charts/ChartContainer';
import { echarts } from '@/lib/echarts';
import { resizeEChart } from '@/utils/chart';

import { useCorrelationPairHistory } from '../api';
import { ChartConfig } from '../types';

export type CorrelationPairHistoryProps = {
    symbol1: string;
    symbol2: string;
    type: string;
    hours: string;
    hoursOptions: Record<string, string>;
    typeOptions: string[];
    symbolOptions: string[];
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const CorrelationPairHistory = (props: CorrelationPairHistoryProps) => {
    const {
        symbol1,
        symbol2,
        type,
        hours,
        hoursOptions,
        typeOptions,
        symbolOptions,
        onAddClick,
        onRemoveClick,
        onConfigChange,
    } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);

    const correlationPairHistory = useCorrelationPairHistory({
        symbol1,
        symbol2,
        type,
        hours,
    });

    const option: EChartsOption = {
        grid: {
            bottom: '15',
            containLabel: true,
            left: '5',
            right: '5',
            top: '15',
        },
        series: [
            {
                data: correlationPairHistory.data?.history,
                smooth: true,
                type: 'line',
                symbol: 'circle',
            },
        ],
        tooltip: {
            axisPointer: {
                type: 'line',
            },
            trigger: 'axis',
            formatter: (params: any) => {
                const param = params[0];
                const date = format(subMinutes(new Date(param.value[0]), 1), 'M/d/yyyy h:mm a');
                return `${param.marker}${date}<br/>Correlation: <strong>${param.value[1]}</strong>`;
            },
        },
        xAxis: {
            axisLabel: {
                formatter: (value: number) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
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
                formatter: (value: number) => value.toFixed(2),
            },
            max: 1,
            min: -1,
            splitLine: {
                lineStyle: {
                    color: '#334155',
                },
            },
            type: 'value',
        },
    };

    const selects = [
        {
            class: 'w-32',
            componentName: ComponentName.Select,
            onChange: (val: string) => {
                onConfigChange?.({ symbol1: val });
            },
            options: symbolOptions,
            value: symbol1,
        },
        {
            class: 'w-32',
            componentName: ComponentName.Select,
            onChange: (val: string) => {
                onConfigChange?.({ symbol2: val });
            },
            options: symbolOptions,
            value: symbol2,
        },
        {
            componentName: ComponentName.Select,
            onChange: (val: string) => {
                onConfigChange?.({ hours: val });
            },
            options: hoursOptions,
            value: hours,
        },
        {
            class: 'w-24',
            componentName: ComponentName.Select,
            onChange: (val: string) => {
                onConfigChange?.({ type: val });
            },
            options: typeOptions,
            value: type,
        },
    ];

    return (
        <ChartContainer
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            selects={selects}
            title={'Correlation Pair History'}
        >
            <ReactEChartsCore
                echarts={echarts}
                onChartReady={() => resizeEChart(chartRef)}
                option={option}
                ref={chartRef}
                style={{ height: '92%', width: '100%' }}
            />
        </ChartContainer>
    );
};

export default CorrelationPairHistory;
