import ReactEcharts from 'echarts-for-react';
import {memo} from 'react';

import {useMediaQuery} from '@/hooks/useMediaQuery';

const Heatmap = (props: any) => {
    const {data} = props;

    const matches = useMediaQuery('(min-width: 48em)');

    const option = {
        grid: {top: 20, right: 82, bottom: 30, left: 50},
        tooltip: {
            position: 'top',
            formatter: function (params: any) {
                const yLabel = data?.data?.xAxis[params?.data?.[1]];
                return `${params.marker}${yLabel} - ${params.name}: <strong>${params.value[2]}</strong>`;
            },
        },
        xAxis: {
            type: 'category',
            data: data?.data?.xAxis,
            splitArea: {
                show: true,
            },
        },
        yAxis: {
            type: 'category',
            data: data?.data?.yAxis,
            splitArea: {
                show: true,
            },
        },
        dataZoom: {
            type: 'inside',
        },
        visualMap: {
            min: -1,
            max: 1,
            calculable: true,
            orient: 'vertical',
            right: '3',
            bottom: '25%',
            textStyle: {
                color: '#B8A3A5',
            },
            splitNumber: 10,
            precision: 2,
            inRange: {
                color: ['#67001f', '#a50f15', '#d6604d', '#f4a582', '#ffffff', '#92c5de', '#4393c3', '#2166ac'],
            },
        },
        series: [
            {
                type: 'heatmap',
                data: data?.data?.data,
                label: {
                    show: matches && data?.data?.data?.length < 150,
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                    },
                },
            },
        ],
    };
    return <ReactEcharts option={option} style={{width: '100%', height: '92%'}}></ReactEcharts>;
};

export default memo(Heatmap);
