import {useRef} from 'react';
import ReactEcharts, {type EChartsOption} from 'echarts-for-react';
import {maxBy, minBy} from 'lodash-es';

import {useHeatmapData} from './api';
import {resizeEChart} from '@/utils/chart';

const CSTreemap = () => {
    const chartRef = useRef<ReactEcharts | null>(null);

    const treemap = useHeatmapData();

    const children =
        treemap.data?.map((coin) => {
            return {
                ...coin,
                value: [coin.value, coin.colorValue],
            };
        }) || [];

    const lowestPercentage = minBy(children, 'colorValue')?.colorValue ?? -100;
    const highestPercentage = maxBy(children, 'colorValue')?.colorValue ?? 100;

    const absPercentage = Math.max(Math.abs(lowestPercentage), Math.abs(highestPercentage));

    const option: EChartsOption = {
        series: [
            {
                data: [{children}],
                height: '100%',
                label: {
                    fontSize: 18,
                    formatter: (params: any) => {
                        return `${params.data.name?.toUpperCase()}\n${params.data.colorValue?.toFixed(2)}%`;
                    },
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
                visualMin: -absPercentage,
                width: '100%',
            },
        ],
    };

    return (
        !treemap.isLoading && (
            <ReactEcharts
                option={option}
                ref={chartRef}
                style={{height: '95%', width: '100%'}}
                onChartReady={() => resizeEChart(chartRef)}
            />
        )
    );
};

export default CSTreemap;
