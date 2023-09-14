import {memo, useMemo} from 'react';
import ReactEcharts from 'echarts-for-react';

import ChartContainer from './ChartContainer';

import {useBetaHeatMapData} from '../api';

const BetaHeatmap = () => {
    const betaHeatmap = useBetaHeatMapData('3m');

    const option = useMemo(
        () => ({
            grid: {top: 20, right: 60, bottom: 30, left: 50},
            tooltip: {
                position: 'top',
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
                min: -1,
                max: 1,
                calculable: true,
                orient: 'vertical',
                right: '2',
                bottom: '25%',
                textStyle: {
                    color: '#fff',
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
        }),
        [betaHeatmap.isFetched],
    );

    return (
        <ChartContainer
            header={<h3>Pearson correlation</h3>}
            body={<ReactEcharts option={option} style={{width: '100%', height: '92%'}}></ReactEcharts>}
        />
    );
};

export default memo(BetaHeatmap);
