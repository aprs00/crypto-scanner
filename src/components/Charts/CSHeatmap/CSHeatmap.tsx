import type { EChartsOption } from 'echarts';

import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useRef } from 'react';

import { echarts, ECHARTS_THEME } from '@/lib/echarts';
import { heatmapGradient, palette } from '@/lib/theme';
import { CorrelationHeatmapResponse, GridHeatmapResponse, HeatmapType, type HeatmapResponse } from '@/types/api';
import { resizeEChart } from '@/utils/chart';

type HeatmapProps = {
    data?: HeatmapResponse;
    visualMin?: number;
    visualMax?: number;
};

function CSHeatmap(props: HeatmapProps) {
    const { data, visualMin, visualMax } = props;

    const chartRef = useRef<ReactEChartsCore | null>(null);

    const processHeatmapData = (data?: HeatmapResponse) => {
        switch (data?.type) {
            case HeatmapType.Grid:
                return {
                    seriesData: processGridData(data),
                    axisData: { xAxis: data.x_axis, yAxis: data.y_axis },
                };
            case HeatmapType.Correlation:
                return {
                    seriesData: processCorrelationData(data),
                    axisData: { xAxis: data.axis, yAxis: data.axis },
                };
            default:
                return {
                    seriesData: [],
                    axisData: { xAxis: [], yAxis: [] },
                };
        }
    };

    const processGridData = (data: GridHeatmapResponse) => {
        const matrix = [];
        const valuesPerYAxis = data.x_axis.length;

        for (let i = 0; i < data.y_axis.length; i++) {
            for (let j = 0; j < data.x_axis.length; j++) {
                const dataIndex = i * valuesPerYAxis + j;
                const value = data.data[dataIndex];

                matrix.push([j, i, value]);
            }
        }

        return matrix;
    };

    const processCorrelationData = (data: CorrelationHeatmapResponse) => {
        const N = data.axis.length;
        const matrix = [];

        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const index = i * N - (i * (i + 1)) / 2 + j - i - 1;
                const value = data.data[index];

                if (value !== undefined && value !== null && !isNaN(value)) {
                    matrix.push([i, j, value]);
                }
            }
        }

        return matrix;
    };

    const { seriesData, axisData } = processHeatmapData(data);

    const option: EChartsOption = {
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: [0],
            },
        ],
        grid: { bottom: 110, left: 50, right: 10, top: 20 },
        series: [
            {
                data: seriesData,
                emphasis: {
                    itemStyle: {
                        borderColor: palette.ac,
                        borderWidth: 1,
                    },
                },
                type: 'heatmap',
                progressive: 100000,
                animation: false,
            },
        ],
        tooltip: {
            formatter: function (params: any) {
                const { yAxis, xAxis } = axisData;
                const dataPoint = params.data as [number, number, number];
                const yLabel = yAxis[dataPoint[1]];
                const xLabel = xAxis[dataPoint[0]];
                const value = dataPoint[2];

                return `${params.marker}${yLabel} - ${xLabel}: <strong>${value}</strong>`;
            },
            position: 'top',
        },
        visualMap: {
            align: 'top',
            bottom: 22,
            calculable: true,
            inRange: {
                color: heatmapGradient,
            },
            max: visualMax ?? 1,
            min: visualMin ?? -1,
            realtime: false,
            orient: 'horizontal',
            precision: 2,
            right: '3',
        },
        xAxis: {
            data: axisData.xAxis,
            type: 'category',
        },
        yAxis: {
            data: axisData.yAxis,
            type: 'category',
        },
    };

    return (
        <ReactEChartsCore
            echarts={echarts}
            onChartReady={() => resizeEChart(chartRef)}
            option={option}
            opts={{ renderer: 'canvas' }}
            ref={chartRef}
            style={{ height: '100%', width: '100%' }}
            theme={ECHARTS_THEME}
        />
    );
}

export default CSHeatmap;
