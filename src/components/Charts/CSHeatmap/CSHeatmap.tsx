import {useMediaQuery} from '@mantine/hooks';
import ReactEcharts, {EChartsOption} from 'echarts-for-react';
import {useRef} from 'react';

import {HeatmapResponse} from '@/types/api';

export type HeatmapProps = {
    data?: HeatmapResponse;
    tooltipType?: 'duration';
};
const CSHeatmap = (props: HeatmapProps) => {
    const {data, tooltipType} = props;

    const chartRef = useRef<ReactEcharts | null>(null);

    const matches = useMediaQuery('(min-width: 48em)');

    const option: EChartsOption = {
        dataZoom: {
            type: 'inside',
        },
        grid: {bottom: 110, left: 50, right: 15, top: 20},
        series: [
            {
                data: data?.data,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
                label: {
                    show: matches && (data?.data?.length ?? 0) < 150,
                },
                type: 'heatmap',
            },
        ],
        tooltip: {
            formatter: function (params: any) {
                if (tooltipType === 'duration') {
                    const xLabel = data?.yAxis[params.data?.[1]];
                    return `${params.marker} ${xLabel}: <strong>${params.value[2]}</strong><br><span class="ml-4">${params.name}h</span>`;
                }

                const yLabel = data?.xAxis[params.data?.[1]];
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
            orient: 'horizontal',
            precision: 2,
            right: '3',
            textStyle: {
                color: '#B8A3A5',
            },
        },
        xAxis: {
            data: data?.xAxis,
            splitArea: {
                show: true,
            },
            type: 'category',
        },
        yAxis: {
            data: data?.yAxis,
            splitArea: {
                show: true,
            },
            type: 'category',
        },
    };

    return <ReactEcharts option={option} ref={chartRef} style={{height: '100%', width: '100%'}} />;
};

export default CSHeatmap;
