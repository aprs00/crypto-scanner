import {memo, useMemo} from 'react';
import ReactEcharts from 'echarts-for-react';

import ChartContainer from './ChartContainer';

import {useBetaHeatMapData} from '../api';

const BetaHeatmap = () => {
    const betaHeatmap = useBetaHeatMapData('6m');

    const option = {
        grid: {top: 20, right: 115, bottom: 30, left: 50},
        tooltip: {
            position: 'top',
            formatter: function (params: any) {
                const yLabel = betaHeatmap?.data?.xAxis[params?.data?.[1]];
                return `${params.marker}${yLabel} - ${params.name}: <strong>${params.value[2]}</strong>`;
            },
        },
        xAxis: {
            type: 'category',
            data: betaHeatmap?.data?.xAxis,
            splitArea: {
                show: true,
            },
        },
        yAxis: {
            type: 'category',
            data: betaHeatmap?.data?.yAxis,
            splitArea: {
                show: true,
            },
        },
        visualMap: {
            type: 'piecewise',
            min: -1,
            max: 1,
            calculable: true,
            orient: 'vertical',
            right: '3',
            bottom: '32%',
            textStyle: {
                color: '#B8A3A5',
            },
            precision: 2,
            inRange: {
                color: ['#67001f', '#a50f15', '#d6604d', '#f4a582', '#ffffff', '#92c5de', '#4393c3', '#2166ac'],
            },
        },
        series: [
            {
                type: 'heatmap',
                data: betaHeatmap?.data?.data,
                label: {
                    show: true,
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

    return (
        <ChartContainer
            header={<h3>Pearson correlation: 6m</h3>}
            body={<ReactEcharts option={option} style={{width: '100%', height: '92%'}}></ReactEcharts>}
        />
    );
};

export default memo(BetaHeatmap);
