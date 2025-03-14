import type { SelectOption } from '@/types/api';

import ChartContainer from '@/components/Charts/ChartContainer';
import { resizeEChart } from '@/utils/chart';
import ReactEcharts, { type EChartsOption } from 'echarts-for-react';
import { useRef } from 'react';

import { usePriceChangePercentage } from '../api';
import { ChartConfig } from '../types';

export type PriceChangePercentageProps = {
    tf: string;
    symbol: string;
    timeFrameOptions: SelectOption[];
    tickerOptions: SelectOption[];
    type: 'day' | 'hour';
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const PriceChangePercentage = (props: PriceChangePercentageProps) => {
    const { symbol, tf, tickerOptions, timeFrameOptions, type, onAddClick, onRemoveClick, onConfigChange } = props;

    const chartRef = useRef<ReactEcharts | null>(null);

    const priceChangePercentageApi = usePriceChangePercentage({
        duration: tf,
        symbol: symbol,
        type,
    });

    const titleMapper = {
        day: 'Price change per day of week',
        hour: 'Price change per hour of day (UTC)',
    };

    const selects = [
        {
            componentName: 'select',
            id: '1',
            onChange: (tf: string) => {
                onConfigChange?.({ tf });
            },
            options: timeFrameOptions,
            value: tf,
        },
        {
            class: 'w-28',
            componentName: 'select',
            id: '2',
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
                <ReactEcharts
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
