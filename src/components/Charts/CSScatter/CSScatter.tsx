import type {ZScoreMatrixResponse} from '@/types/api';

import {resizeEChart} from '@/utils/chart';
import ReactEcharts, {EChartsOption} from 'echarts-for-react';
import {capitalize} from 'lodash-es';
import {useRef} from 'react';

export type ScatterProps = {
    data: ZScoreMatrixResponse[];
    xAxis: string;
    yAxis: string;
};

const CSScatter = (props: ScatterProps) => {
    const {data, xAxis, yAxis} = props;

    const chartRef = useRef<ReactEcharts | null>(null);

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
        series: data as echarts.SeriesOption[],
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
        <ReactEcharts
            onChartReady={() => resizeEChart(chartRef)}
            option={option}
            ref={chartRef}
            style={{height: '100%', width: '100%'}}
        />
    );
};

export default CSScatter;
