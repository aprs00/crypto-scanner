import type { EChartsOption } from 'echarts';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useRef } from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';
import { echarts } from '@/lib/echarts';
import { resizeEChart } from '@/utils/chart';

import { usePriceChangePercentage } from '../api';
import { ExchangeChartConfig, ExchangeInfo, TimePeriodType } from '../types';

export type PriceChangePercentageProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    hours: string;
    symbol: string;
    timeFrameOptions: Record<string, string>;
    symbolOptions: string[];
    periodType: TimePeriodType;
    onRemoveClick: () => void;
    onExchangeChange: (exchange: string) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const PriceChangePercentage = (props: PriceChangePercentageProps) => {
    const {
        exchange,
        exchanges,
        symbol,
        hours,
        symbolOptions,
        timeFrameOptions,
        periodType,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);

    const priceChangePercentageApi = usePriceChangePercentage({
        exchange,
        hours,
        symbol,
        type: periodType,
    });

    const titleMapper = {
        day: 'Price change per day of week',
        hour: 'Price change per hour of day (UTC)',
    };

    const controls = (
        <>
            <CSSelect<string>
                onChange={(hours) => {
                    onConfigChange({ hours });
                }}
                options={timeFrameOptions}
                value={hours}
            />
            <CSSelect<string>
                classes="w-32"
                onChange={(symbol) => {
                    onConfigChange({ symbol });
                }}
                options={symbolOptions}
                value={symbol}
            />
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

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
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title={titleMapper[periodType]}>
            <ReactEChartsCore
                echarts={echarts}
                onChartReady={() => resizeEChart(chartRef)}
                option={option}
                ref={chartRef}
                style={{ height: '100%', width: '100%' }}
            />
        </ChartContainer>
    );
};

export default PriceChangePercentage;
