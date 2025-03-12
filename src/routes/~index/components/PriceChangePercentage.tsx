import ReactEcharts, {type EChartsOption} from 'echarts-for-react';
import {useRef} from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import type {SelectOption} from '@/types/api';

import {usePriceChangePercentage} from '../api';
import {ChartConfig} from '../types';
import {resizeEChart} from '@/utils/chart';

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
    const {symbol, tf, tickerOptions, timeFrameOptions, type, onAddClick, onRemoveClick, onConfigChange} = props;

    const chartRef = useRef<ReactEcharts | null>(null);

    const priceChangePercentageApi = usePriceChangePercentage({
        duration: tf,
        symbol: symbol,
        type,
    });

    const titleMapper = {
        day: 'Average price change per day of week',
        hour: 'Average price change per hour of day (UTC)',
    };

    const selects = [
        {
            class: 'w-28',
            componentName: 'select',
            id: '1',
            onChange: (symbol: string) => {
                onConfigChange?.({symbol});
            },
            options: tickerOptions,
            value: symbol,
        },
        {
            componentName: 'select',
            id: '2',
            onChange: (tf: string) => {
                onConfigChange?.({tf});
            },
            options: timeFrameOptions,
            value: tf,
        },
    ];

    const option: EChartsOption = {
        grid: {bottom: 60, left: 45, right: 20, top: 20},
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
                    option={option}
                    ref={chartRef}
                    style={{height: '100%', width: '100%'}}
                    onChartReady={() => resizeEChart(chartRef)}
                />
            }
            selects={selects}
            title={titleMapper[type]}
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
        />
    );
};

export default PriceChangePercentage;
