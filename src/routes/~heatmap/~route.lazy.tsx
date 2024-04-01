import {createLazyFileRoute} from '@tanstack/react-router';
import ReactEcharts from 'echarts-for-react';
import _ from 'lodash-es';

import {useHeatmapData} from './api';

export const Route = createLazyFileRoute('/heatmap')({
    component: Heatmap,
});

function Heatmap() {
    const heatmap = useHeatmapData();

    const children =
        heatmap?.data?.map((coin) => {
            return {
                ...coin,
                value: [coin.value, coin.colorValue],
            };
        }) || [];

    const lowestPercentage = _.minBy(children, 'colorValue')?.colorValue ?? -100;
    const highestPercentage = _.maxBy(children, 'colorValue')?.colorValue ?? 100;

    const absPercentage = Math.max(Math.abs(lowestPercentage), Math.abs(highestPercentage));

    const option = {
        series: [
            {
                data: [{children}],
                height: '100%',
                label: {
                    fontSize: 20,
                    formatter: (params: any) => {
                        return `${params.data.name?.toUpperCase()}\n${params.data.colorValue?.toFixed(2)}%`;
                    },
                    lineHeight: 26,
                    show: true,
                },
                levels: [
                    {
                        itemStyle: {
                            borderColor: '#333',
                            borderWidth: 1,
                            gapWidth: 1,
                        },
                    },
                    {
                        color: [
                            '#450a0a',
                            '#7f1d1d',
                            '#991b1b',
                            '#b91c1c',
                            '#dc2626',
                            '#ef4444',
                            '#f87171',
                            '#4ade80',
                            '#22c55e',
                            '#16a34a',
                            '#15803d',
                            '#166534',
                            '#14532d',
                            '#052e16',
                        ],
                        colorMappingBy: 'value',
                        itemStyle: {
                            gapWidth: 1,
                        },
                    },
                ],
                type: 'treemap',
                visualDimension: 1,
                visualMax: absPercentage,
                visualMin: absPercentage,
                width: '100%',
            },
        ],
    };

    return !heatmap.isLoading && <ReactEcharts option={option} style={{height: '95%', width: '100%'}}></ReactEcharts>;
}
