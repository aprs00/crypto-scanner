import type { EChartsOption } from 'echarts';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useRef } from 'react';

import ChartContainer, { ComponentName } from '@/components/Charts/ChartContainer';
import { echarts } from '@/lib/echarts';
import { resizeEChart } from '@/utils/chart';

import { useZScoreHistory } from '../api';
import { ChartConfig } from '../types';

export type ZScoreHistoryProps = {
    type: string;
    hoursOptions: Record<string, string>;
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const tf = '12h';

const ZScoreHistory = (props: ZScoreHistoryProps) => {
    const { type, hoursOptions, onAddClick, onRemoveClick, onConfigChange } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);

    const zScoreHistory = useZScoreHistory({
        duration: tf,
        type: type,
    });

    const option: EChartsOption = {
        grid: {
            bottom: '0',
            containLabel: true,
            left: '15',
            right: '15',
        },
        legend: {
            itemStyle: {
                borderJoin: 'miter',
                borderWidth: 100,
            },
            left: '15',
            textStyle: {
                color: '#d1d5db',
            },
            top: '10',
            type: 'scroll',
        },
        series: zScoreHistory.data?.data,
        tooltip: {
            trigger: 'axis',
        },
        xAxis: {
            boundaryGap: false,
            data: zScoreHistory.data?.xAxis,
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
                },
            },
            type: 'category',
        },
        yAxis: {
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
            class: 'w-24',
            componentName: ComponentName.Select,
            onChange: (val: string) => {
                onConfigChange?.({ type: val });
            },
            options: hoursOptions || [],
            value: type,
        },
    ];

    return (
        <ChartContainer
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            selects={selects}
            title={`Z Score - ${tf} (UTC)`}
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

export default ZScoreHistory;
