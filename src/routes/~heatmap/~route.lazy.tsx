import {createLazyFileRoute} from '@tanstack/react-router';
import ReactEcharts from 'echarts-for-react';

import {useHeatmapData} from './api';

export const Route = createLazyFileRoute('/heatmap')({
    component: Heatmap,
});

function Heatmap() {
    const heatmap = useHeatmapData();

    // const percentageArray = heatmap?.data?.map((item) => item.colorValue) || [];

    // const minCryptoPercentage = Math.min(...percentageArray);
    // const maxCryptoPercentage = Math.max(...percentageArray);
    // // const absPercentageValue = Math.abs(Math.max(maxCryptoPercentage, minCryptoPercentage));

    // console.log(minCryptoPercentage);
    // console.log(maxCryptoPercentage);

    // const maxAbsValue = Math.max(Math.abs(minCryptoPercentage), Math.abs(maxCryptoPercentage));
    // console.log(maxAbsValue);

    const option = {
        series: {
            type: 'treemap',
            data: heatmap?.data,
            width: '950%',
            height: '100%',
            label: {
                show: true,
                formatter: (params: any) => {
                    return `${params.data.coinName}\n${params.data.colorValue?.toFixed(2)}%`;
                },
            },
            levels: [
                {
                    // color: ['#14532d', '#7f1d1d'],
                },
            ],
        },
    };

    return <ReactEcharts option={option} style={{height: '100%', width: '100%'}}></ReactEcharts>;
}
