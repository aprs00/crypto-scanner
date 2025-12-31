import type { EChartsOption, SeriesOption } from 'echarts';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import { capitalize } from 'lodash-es';
import { useRef } from 'react';

import { echarts } from '@/lib/echarts';
import { resizeEChart } from '@/utils/chart';

export type ScatterProps = {
    data: SeriesOption[];
    xAxis: string;
    yAxis: string;
};

const CSScatter = (props: ScatterProps) => {
    const { data, xAxis, yAxis } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);

    const option: EChartsOption = {
        dataZoom: {
            type: 'inside',
        },
        graphic: [
            {
                left: 10,
                rotation: Math.PI / 2,
                style: {
                    fill: '#cbd5e1',
                    fontSize: 18,
                    text: capitalize(yAxis),
                },
                top: '44%',
                type: 'text',
            },
            {
                bottom: 42,
                left: '50%',
                style: {
                    fill: '#cbd5e1',
                    fontSize: 18,
                    text: capitalize(xAxis),
                },
                type: 'text',
            },
        ],
        grid: {
            bottom: 95,
            left: 65,
            right: 20,
            top: 60,
        },
        legend: {
            textStyle: {
                color: '#d1d5db',
            },
            top: 10,
            type: 'scroll',
        },
        series: data,
        tooltip: {
            formatter: function (params: any) {
                return `
                    ${params.marker}${params.seriesName}
                    <br />
                    <span>${capitalize(xAxis)}: ${params.data[0]} ${capitalize(yAxis)}: ${params.data[1]}</span>
                `;
            },
        },
        xAxis: {
            scale: true,
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
                },
            },
            type: 'value',
        },
        yAxis: {
            scale: true,
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
                },
            },
            type: 'value',
        },
    };

    return (
        <ReactEChartsCore
            echarts={echarts}
            notMerge={true}
            onChartReady={() => resizeEChart(chartRef)}
            option={option}
            ref={chartRef}
            style={{ height: '100%', width: '100%' }}
        />
    );
};

export default CSScatter;
