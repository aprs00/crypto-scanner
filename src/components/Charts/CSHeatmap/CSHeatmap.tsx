import { CorrelationHeatmapResponse, GridHeatmapResponse, type HeatmapResponse } from '@/types/api';
import { resizeEChart } from '@/utils/chart';
import ReactEcharts, { type EChartsOption } from 'echarts-for-react';
import { useRef } from 'react';

type HeatmapProps = {
    data?: HeatmapResponse;
    visualMin?: number;
    visualMax?: number;
};

function CSHeatmap(props: HeatmapProps) {
    const { data, visualMin, visualMax } = props;

    const chartRef = useRef<ReactEcharts | null>(null);

    const processHeatmapData = (data?: HeatmapResponse) => {
        switch (data?.type) {
            case 'grid':
                return {
                    seriesData: processGridData(data),
                    axisData: { xAxis: data.x_axis, yAxis: data.y_axis },
                };
            case 'correlation':
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

                matrix.push([j, i, Math.round(value * 100) / 100]);
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
                    matrix.push([i, j, Math.round(value * 100) / 100]);
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
        grid: { bottom: 110, left: 50, right: 15, top: 20 },
        series: [
            {
                data: seriesData,
                emphasis: {
                    itemStyle: {
                        borderColor: '#000',
                        borderWidth: 1,
                    },
                },
                type: 'heatmap',
                progressive: 10000,
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
            bottom: 32,
            calculable: true,
            inRange: {
                color: ['#67001f', '#a50f15', '#d6604d', '#f4a582', '#ffffff', '#92c5de', '#4393c3', '#2166ac'],
            },
            max: visualMax ?? 1,
            min: visualMin ?? -1,
            realtime: false,
            orient: 'horizontal',
            precision: 2,
            right: '3',
            textStyle: {
                color: '#B8A3A5',
            },
        },
        xAxis: {
            data: axisData.xAxis,
            splitArea: {
                show: true,
            },
            type: 'category',
        },
        yAxis: {
            data: axisData.yAxis,
            splitArea: {
                show: true,
            },
            type: 'category',
        },
    };

    return (
        <ReactEcharts
            onChartReady={() => resizeEChart(chartRef)}
            option={option}
            opts={{ renderer: 'canvas' }}
            ref={chartRef}
            style={{ height: '100%', width: '100%' }}
        />
    );
}

export default CSHeatmap;
