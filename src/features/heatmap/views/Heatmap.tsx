import {useEffect, useRef, useMemo} from 'react';
import * as echarts from 'echarts';
import type {EChartsOption} from 'echarts';

import {useHeatmapData} from '../api';

const Heatmap = () => {
    const heatmap = useHeatmapData();
    const chartRef = useRef(null);

    const percentageArray = useMemo(() => {
        return heatmap?.data?.map((item) => item.colorValue);
    }, [heatmap?.data]);

    const maxCryptoPercentage = useMemo(() => {
        return heatmap?.data ? Math.max(...heatmap.data.map((item) => item.colorValue)) : 0;
    }, [percentageArray]);

    const minCryptoPercentage = useMemo(() => {
        return heatmap?.data ? Math.min(...heatmap.data.map((item) => item.colorValue)) : 0;
    }, [percentageArray]);

    useEffect(() => {
        if (!chartRef.current) return;
        if (!heatmap?.data) return;

        const chart = echarts.init(chartRef.current as any);
        const option: EChartsOption = {
            series: {
                type: 'treemap',
                data: heatmap?.data,
                visualDimension: 4,
                leafDepth: 1,
                visibleMin: 300,
                label: {
                    show: true,
                    formatter: (params: any) => {
                        return `${params.data.coinName}\n${params.data.colorValue?.toFixed(2)}%`;
                    },
                },
                // itemStyle: {
                //     color: (params: any) => {
                //         return '#000';
                //     },
                // },
                breadcrumb: {
                    itemStyle: {
                        color: '#0369a1',
                    },
                },
                levels: [
                    {
                        itemStyle: {
                            borderColor: '#fff',
                            borderWidth: 1,
                            gapWidth: 1,
                        },
                    },
                    {
                        itemStyle: {
                            borderColor: '#ddd',
                            borderWidth: 0,
                            gapWidth: 0,
                        },
                    },
                ],
            },
        };

        chart.setOption(option);

        return () => {
            chart.dispose();
        };
    }, [heatmap?.data]);

    return <div ref={chartRef} style={{height: '50vh'}} />;
};

export default Heatmap;
