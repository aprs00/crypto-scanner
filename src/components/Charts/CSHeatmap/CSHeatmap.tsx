import { HeatmapResponse } from '@/types/api';
import { resizeEChart } from '@/utils/chart';
import ReactEcharts, { type EChartsOption } from 'echarts-for-react';
import { useRef, useMemo } from 'react';

export type HeatmapProps = {
    data?: HeatmapResponse;
};

const CSHeatmap = (props: HeatmapProps) => {
    const { data } = props;

    const chartRef = useRef<ReactEcharts | null>(null);

    const formattedData = useMemo(() => {
        if (!data?.data || !data?.axis) return [];

        const N = data.axis.length;
        const matrix = [];

        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                const index = i * N - (i * (i + 1)) / 2 + j - i - 1;

                matrix.push([i, j, data.data[index]]);
            }
        }
        return matrix;
    }, [data]);

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
                data: formattedData,
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
                const yLabel = data?.axis[params.data?.[1]];
                return `${params.marker}${yLabel} - ${params.name}: <strong>${params.value[2]}</strong>`;
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
            max: 1,
            min: -1,
            realtime: false,
            orient: 'horizontal',
            precision: 2,
            right: '3',
            textStyle: {
                color: '#B8A3A5',
            },
        },
        xAxis: {
            data: data?.axis,
            splitArea: {
                show: true,
            },
            type: 'category',
        },
        yAxis: {
            data: data?.axis,
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
};

export default CSHeatmap;
