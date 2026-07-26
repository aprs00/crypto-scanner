import type { EChartsOption } from 'echarts';

import { useRef } from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';
import { echarts, ECHARTS_THEME } from '@/lib/echarts';
import { ReactEChartsCore } from '@/lib/ReactECharts';
import { palette } from '@/lib/theme';
import { resizeEChart } from '@/utils/chart';

import { usePriceChangePercentage } from '../api';
import { ChartType, ExchangeChartConfig, ExchangeInfo, TimePeriodType } from '../types';

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

    const chartType =
        periodType === TimePeriodType.Day ? ChartType.PriceChangePercentageDay : ChartType.PriceChangePercentageHour;

    const controls = (
        <>
            <CSSelect<string>
                ariaLabel="Time frame"
                onChange={(hours) => {
                    onConfigChange({ hours });
                }}
                options={timeFrameOptions}
                value={hours}
            />
            <CSSelect<string>
                ariaLabel="Symbol"
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

    const bars = priceChangePercentageApi.data?.data?.map((bar) => ({
        value: bar.value,
        itemStyle: { color: bar.value >= 0 ? palette.up : palette.down },
    }));

    const option: EChartsOption = {
        grid: { bottom: 40, left: 40, right: 20, top: 20 },
        series: [
            {
                data: bars,
                type: 'bar',
            },
        ],
        tooltip: {
            axisPointer: { type: 'shadow' },
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
            axisLabel: { formatter: '{value}%' },
            type: 'value',
        },
    };

    return (
        <ChartContainer chartType={chartType} controls={controls} onRemoveClick={onRemoveClick}>
            <ReactEChartsCore
                echarts={echarts}
                onChartReady={() => resizeEChart(chartRef)}
                option={option}
                ref={chartRef}
                style={{ height: '100%', width: '100%' }}
                theme={ECHARTS_THEME}
            />
        </ChartContainer>
    );
};

export default PriceChangePercentage;
