import {memo, useEffect, useMemo, useRef} from 'react';
import * as echarts from 'echarts';

import {useBetaHeatMapData} from '../api';

type EChartsOption = echarts.EChartsOption;

let option: EChartsOption;

const BetaHeatmap = () => {
    const chartRef = useRef(null);

    const betaHeatmap = useBetaHeatMapData('3m');
    console.log('betaHeatmap', betaHeatmap);

    const option = useMemo(
        () => ({
            tooltip: {
                position: 'top',
            },
            grid: {
                height: '70%',
                top: '10%',
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
                orient: 'horizontal',
                left: 'center',
                bottom: '0%',
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

    useEffect(() => {
        if (!betaHeatmap.isFetched) return;
        const myChart = echarts.init(chartRef.current!);

        myChart.setOption(option);

        return () => {
            myChart.dispose();
        };
    }, [betaHeatmap.isFetched]);

    return (
        <div id="heatmap-container">
            <div ref={chartRef} style={{width: '100% !important', height: '400px'}} />
        </div>
    );
};

export default memo(BetaHeatmap);
