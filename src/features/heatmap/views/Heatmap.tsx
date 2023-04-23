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
                colorMappingBy: 'value',
                label: {
                    show: true,
                    formatter: (params: any) => {
                        return `${params.data.coinName}\n${params.data.colorValue?.toFixed(2)}%`;
                    },
                },
                // visualMap: {
                //     min: minCryptoPercentage,
                //     max: maxCryptoPercentage,
                //     inRange: {
                //         color: ['#FF3333', '#DDDDDD', '#33FF33'],
                //     },
                // },
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

    // if (cryptoData?.isLoading) return <h1>LOADING...</h1>;

    return <div ref={chartRef} style={{height: '50vh'}} />;
};

export default Heatmap;
