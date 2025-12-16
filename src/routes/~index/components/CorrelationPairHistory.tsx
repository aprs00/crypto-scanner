import type { EChartsOption } from 'echarts';

import { format, subMinutes } from 'date-fns';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useRef } from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSSelect from '@/components/UI/CSSelect';
import { echarts } from '@/lib/echarts';
import { resizeEChart } from '@/utils/chart';

import { useCorrelationPairHistory } from '../api';
import { ChartConfig, DataType } from '../types';

export type CorrelationPairHistoryProps = {
    baseSymbol: string;
    comparisonSymbols: string[];
    dataType: DataType;
    hours: string;
    hoursOptions: Record<string, string>;
    typeOptions: Array<DataType>;
    symbolOptions: string[];
    onAddClick: () => void;
    onRemoveClick?: () => void;
    onConfigChange: (config: ChartConfig) => void;
};

const CorrelationPairHistory = (props: CorrelationPairHistoryProps) => {
    const {
        baseSymbol,
        comparisonSymbols,
        dataType,
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
        baseSymbol,
        comparisonSymbols,
        type: dataType,
        hours,
    });

    const option: EChartsOption = {
        grid: {
            bottom: '40',
            left: '50',
            right: '20',
            top: '15',
        },
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
            axisPointer: {
                type: 'line',
            },
            trigger: 'axis',
            formatter: (params: any) => {
                const date = format(subMinutes(new Date(params[0].value[0]), 1), 'M/d/yyyy h:mm a');
                const lines = [...params]
                    .sort((a, b) => Number(b.value?.[1]) - Number(a.value?.[1]))
                    .map((param: any) => `${param.marker}${param.seriesName}: <strong>${param.value[1]}</strong>`)
                    .join('<br/>');
                return `${date}<br/>${lines}`;
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
            axisLabel: {},
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

    const controls = (
        <>
            <CSSelect<string>
                classes="w-32"
                onChange={(baseSymbol: string) => {
                    onConfigChange({ baseSymbol });
                }}
                options={symbolOptions}
                value={baseSymbol}
            />
            <CSSelect<string>
                classes="w-32"
                multiple
                onChange={(comparisonSymbols: string[]) => {
                    onConfigChange({ comparisonSymbols });
                }}
                options={symbolOptions}
                value={comparisonSymbols}
            />
            <CSSelect<string>
                onChange={(hours: string) => {
                    onConfigChange({ hours });
                }}
                options={hoursOptions}
                value={hours}
            />
            <CSSelect<DataType>
                classes="w-24"
                onChange={(dataType: DataType) => {
                    onConfigChange({ dataType });
                }}
                options={typeOptions}
                value={dataType}
            />
        </>
    );

    return (
        <ChartContainer
            controls={controls}
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            title={'Correlation Pair History'}
        >
            <ReactEChartsCore
                echarts={echarts}
                notMerge={true}
                onChartReady={() => resizeEChart(chartRef)}
                option={option}
                ref={chartRef}
                style={{ height: '92%', width: '100%' }}
            />
        </ChartContainer>
    );
};

export default CorrelationPairHistory;
