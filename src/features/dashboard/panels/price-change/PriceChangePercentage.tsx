import type { EChartsOption } from 'echarts';

import { useRef } from 'react';

import CSSelect from '@/components/UI/CSSelect';
import { palette } from '@/lib/theme';

import ChartContainer from '../shared/charting/ChartContainer';
import { echarts, ECHARTS_THEME } from '../shared/charting/echarts';
import { ReactEChartsCore } from '../shared/charting/ReactECharts';
import { resizeEChart } from '../shared/charting/resizeEChart';
import { usePriceChangePercentage } from '../shared/data/api';
import { ExchangeChartConfig, ExchangeInfo, TimePeriodType } from '../shared/data/types';
import ExchangeSelector from '../shared/ExchangeSelector';

type PriceChangePercentageProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    hours: string;
    symbol: string;
    timeFrameOptions: Record<string, string>;
    symbolOptions: string[];
    title: string;
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
        title,
        timeFrameOptions,
        periodType,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);
    const handleChartReady = () => resizeEChart(chartRef);

    const priceChangePercentageApi = usePriceChangePercentage({
        exchange,
        hours,
        symbol,
        type: periodType,
    });

    const handleHoursChange = (nextHours: string) => onConfigChange({ hours: nextHours });
    const handleSymbolChange = (nextSymbol: string) => onConfigChange({ symbol: nextSymbol });

    const controls = (
        <>
            <CSSelect<string>
                ariaLabel="Time frame"
                onChange={handleHoursChange}
                options={timeFrameOptions}
                value={hours}
            />
            <CSSelect<string>
                ariaLabel="Symbol"
                classes="w-32"
                onChange={handleSymbolChange}
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
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title={title}>
            <ReactEChartsCore
                echarts={echarts}
                onChartReady={handleChartReady}
                option={option}
                ref={chartRef}
                style={{ height: '100%', width: '100%' }}
                theme={ECHARTS_THEME}
            />
        </ChartContainer>
    );
};

export default PriceChangePercentage;
