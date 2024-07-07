import ReactEcharts from 'echarts-for-react';
import {memo, useEffect, useRef} from 'react';

import {useMediaQuery} from '@/hooks/useMediaQuery';

const Heatmap = (props: any) => {
    const {data} = props;

    const chartRef = useRef<ReactEcharts | null>(null);
    const chartInstance = chartRef.current?.getEchartsInstance();

    const matches = useMediaQuery('(min-width: 48em)');

    const option = {
        dataZoom: {
            type: 'inside',
        },
        grid: {bottom: 30, left: 50, right: 82, top: 20},
        series: [
            {
                data: data.data?.data,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
                label: {
                    show: matches && data.data?.data?.length < 150,
                },
                type: 'heatmap',
            },
        ],
        tooltip: {
            formatter: function (params: any) {
                const yLabel = data.data?.xAxis[params.data?.[1]];
                return `${params.marker}${yLabel} - ${params.name}: <strong>${params.value[2]}</strong>`;
            },
            position: 'top',
        },
        visualMap: {
            bottom: '25%',
            calculable: true,
            inRange: {
                color: ['#67001f', '#a50f15', '#d6604d', '#f4a582', '#ffffff', '#92c5de', '#4393c3', '#2166ac'],
            },
            max: 1,
            min: -1,
            orient: 'vertical',
            precision: 2,
            right: '3',
            splitNumber: 10,
            textStyle: {
                color: '#B8A3A5',
            },
        },
        xAxis: {
            data: data.data?.xAxis,
            splitArea: {
                show: true,
            },
            type: 'category',
        },
        yAxis: {
            data: data.data?.yAxis,
            splitArea: {
                show: true,
            },
            type: 'category',
        },
    };

    setTimeout(() => chartInstance?.resize(), 100);

    useEffect(() => {
        chartInstance?.resize();
    }, [data]);

    return <ReactEcharts option={option} ref={(e) => (chartRef.current = e)} style={{height: '94%', width: '100%'}} />;
};

export {Heatmap};
