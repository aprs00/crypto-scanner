import type { EChartsOption } from 'echarts';

import { format, subMinutes } from 'date-fns';
import { useRef } from 'react';

import CSSelect from '@/components/UI/CSSelect';

import ChartContainer from '../shared/charting/ChartContainer';
import { echarts, ECHARTS_THEME } from '../shared/charting/echarts';
import { ReactEChartsCore } from '../shared/charting/ReactECharts';
import { resizeEChart } from '../shared/charting/resizeEChart';
import { useCorrelationPairHistory } from '../shared/data/api';
import { DataType, ExchangeChartConfig, ExchangeInfo } from '../shared/data/types';
import ExchangeSelector from '../shared/ExchangeSelector';
import MultiSelectDrawer from '../shared/MultiSelectDrawer/MultiSelectDrawer';

type CorrelationPairHistoryProps = {
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
    title: string;
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
        title,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);
    const handleChartReady = () => resizeEChart(chartRef);

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

    const handleBaseSymbolChange = (nextBaseSymbol: string) => onConfigChange({ baseSymbol: nextBaseSymbol });
    const handleComparisonSymbolsChange = (nextComparisonSymbols: string[]) =>
        onConfigChange({ comparisonSymbols: nextComparisonSymbols });
    const handleHoursChange = (nextHours: string) => onConfigChange({ hours: nextHours });
    const handleDataTypeChange = (nextDataType: DataType) => onConfigChange({ dataType: nextDataType });

    const controls = (
        <>
            <CSSelect<string>
                ariaLabel="Base symbol"
                classes="w-32"
                onChange={handleBaseSymbolChange}
                options={symbolOptions}
                value={baseSymbol}
            />
            <MultiSelectDrawer
                ariaLabel="Comparison symbols"
                classes="w-32"
                defaultValue={defaultComparisonSymbols}
                maxSelected={32}
                onChange={handleComparisonSymbolsChange}
                options={symbolOptions}
                title="Select comparison symbols"
                value={comparisonSymbols}
            />
            <CSSelect<string>
                ariaLabel="Time range"
                onChange={handleHoursChange}
                options={hoursOptions}
                value={hours}
            />
            <CSSelect<DataType>
                ariaLabel="Data type"
                classes="w-24"
                onChange={handleDataTypeChange}
                options={typeOptions}
                value={dataType}
            />
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title={title}>
            <ReactEChartsCore
                echarts={echarts}
                notMerge={true}
                onChartReady={handleChartReady}
                option={option}
                ref={chartRef}
                style={{ height: '92%', width: '100%' }}
                theme={ECHARTS_THEME}
            />
        </ChartContainer>
    );
};

export default CorrelationPairHistory;
