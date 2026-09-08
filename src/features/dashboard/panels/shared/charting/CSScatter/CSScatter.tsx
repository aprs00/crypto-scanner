import type { EChartsOption, SeriesOption } from 'echarts';

import { capitalize } from 'lodash-es';
import { useRef } from 'react';

import { palette, TERMINAL_FONT } from '@/lib/theme';

import { echarts, ECHARTS_THEME } from '../echarts';
import { ReactEChartsCore } from '../ReactECharts';
import { resizeEChart } from '../resizeEChart';

type ScatterProps = {
    data: SeriesOption[];
    xAxis: string;
    yAxis: string;
};

const axisLabelFont = `bold 12px ${TERMINAL_FONT}`;

const CSScatter = (props: ScatterProps) => {
    const { data, xAxis, yAxis } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);
    const handleChartReady = () => resizeEChart(chartRef);

    const option: EChartsOption = {
        dataZoom: { type: 'inside' },
        graphic: [
            {
                left: 10,
                rotation: Math.PI / 2,
                style: {
                    fill: palette.fg,
                    font: axisLabelFont,
                    text: capitalize(yAxis).toUpperCase(),
                },
                top: '44%',
                type: 'text',
            },
            {
                bottom: 42,
                left: '50%',
                style: {
                    fill: palette.fg,
                    font: axisLabelFont,
                    text: capitalize(xAxis).toUpperCase(),
                },
                type: 'text',
            },
        ],
        grid: { bottom: 35, left: 65, right: 10, top: 60 },
        legend: { top: 10, type: 'scroll' },
        series: data,
        tooltip: {
            formatter: function (params: any) {
                return `
                    ${params.marker}${params.seriesName}
                    <br />
                    <span>${capitalize(xAxis)}: ${params.data[0]} <br /> ${capitalize(yAxis)}: ${params.data[1]}</span>
                `;
            },
        },
        xAxis: { scale: true, type: 'value' },
        yAxis: { scale: true, type: 'value' },
    };

    return (
        <ReactEChartsCore
            echarts={echarts}
            notMerge={true}
            onChartReady={handleChartReady}
            option={option}
            ref={chartRef}
            style={{ height: '100%', width: '100%' }}
            theme={ECHARTS_THEME}
        />
    );
};

export default CSScatter;
