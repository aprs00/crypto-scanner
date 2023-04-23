import {useEffect, useRef, useMemo} from 'react';
import * as echarts from 'echarts';

import {useHeatmapData} from '../api';

const Heatmap = () => {
    const cryptoData = useHeatmapData();
    const chartRef = useRef(null);

    const percentageArray = useMemo(() => {
        return cryptoData?.data?.map((item) => item.colorValue);
    }, [cryptoData?.data]);

    const maxCryptoPercentage = useMemo(() => {
        return cryptoData?.data ? Math.max(...cryptoData.data.map((item) => item.colorValue)) : 0;
    }, [percentageArray]);

    const minCryptoPercentage = useMemo(() => {
        return cryptoData?.data ? Math.min(...cryptoData.data.map((item) => item.colorValue)) : 0;
    }, [percentageArray]);

    useEffect(() => {
        const chart = echarts.init(chartRef.current as any);
        const option = {
            series: {
                type: 'treemap',
                data: cryptoData?.data,
                visualDimension: 4,
                leafDepth: 1,
                visibleMin: 300,
                colorMappingBy: 'value',
                label: {
                    show: true,
                    formatter: function (params) {
                        return `${params.data.coinName}\n${params.data.colorValue?.toFixed(2)}%`;
                    },
                },
                visualMap: {
                    min: minCryptoPercentage,
                    max: maxCryptoPercentage,
                    inRange: {
                        color: ['#FF3333', '#DDDDDD', '#33FF33'],
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
    }, [cryptoData]);

    // if (cryptoData?.isLoading) return <h1>LOADING...</h1>;

    return <div ref={chartRef} style={{height: '50vh'}} />;
};

export default Heatmap;
