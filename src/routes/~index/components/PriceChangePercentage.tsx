import type { EChartsOption } from 'echarts';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useRef } from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import { echarts } from '@/lib/echarts';
import { resizeEChart } from '@/utils/chart';

import { usePriceChangePercentage } from '../api';
import { ChartConfig } from '../types';

export type PriceChangePercentageProps = {
    hours: string;
    symbol: string;
    timeFrameOptions: Record<string, string>;
    tickerOptions: string[];
    type: 'day' | 'hour';
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const PriceChangePercentage = (props: PriceChangePercentageProps) => {
    const { symbol, hours, tickerOptions, timeFrameOptions, type, onAddClick, onRemoveClick, onConfigChange } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);

    const priceChangePercentageApi = usePriceChangePercentage({ hours, symbol, type });

    const titleMapper = {
        day: 'Price change per day of week',
        hour: 'Price change per hour of day (UTC)',
    };

    const selects = [
        {
            componentName: 'select',
            onChange: (hours: string) => {
                onConfigChange?.({ hours });
            },
            options: timeFrameOptions,
            value: hours,
        },
        {
            class: 'w-28',
            componentName: 'select',
            onChange: (symbol: string) => {
                onConfigChange?.({ symbol });
            },
            options: tickerOptions,
            value: symbol,
        },
    ];

    const option: EChartsOption = {
        grid: { bottom: 60, left: 45, right: 20, top: 20 },
        series: [
            {
                data: priceChangePercentageApi.data?.data,
                type: 'bar',
            },
        ],
        tooltip: {
            axisPointer: {
                type: 'shadow',
            },
            formatter: function (params: any) {
                return `${params[0].marker}${params[0].name}: ${params[0].value}%`;
            },
            trigger: 'axis',
        },
        xAxis: {
            data: priceChangePercentageApi.data?.xAxis,
            type: 'category',
        },
        yAxis: {
            axisLabel: {
                formatter: '{value}%',
            },
            splitLine: {
                lineStyle: {
                    color: '#334155',
                },
            },
            type: 'value',
        },
    };

    return (
        <ChartContainer
            body={
                <ReactEChartsCore
                    echarts={echarts}
                    onChartReady={() => resizeEChart(chartRef)}
                    option={option}
                    ref={chartRef}
                    style={{ height: '100%', width: '100%' }}
                />
            }
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            selects={selects}
            title={titleMapper[type]}
        />
    );
};

export default PriceChangePercentage;
