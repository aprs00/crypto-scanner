import {memo, useEffect, useMemo, useRef} from 'react';
import * as echarts from 'echarts';

import {usePriceChangePerDayOfWeek} from '../api';

type EChartsOption = echarts.EChartsOption;

let option: EChartsOption;

const PriceChangePerDayOfWeek = () => {
    const chartRef = useRef(null);

    const priceChangePerDayOfWeekData = usePriceChangePerDayOfWeek('3m');

    const option = useMemo(
        () => ({
            xAxis: {
                type: 'category',
                data: priceChangePerDayOfWeekData?.data?.xAxis,
            },
            yAxis: {
                type: 'value',
            },
            series: [
                {
                    data: priceChangePerDayOfWeekData?.data?.data,
                    type: 'bar',
                },
            ],
        }),
        [priceChangePerDayOfWeekData],
    );

    useEffect(() => {
        if (!priceChangePerDayOfWeekData.isFetched) return;
        const myChart = echarts.init(chartRef.current!);

        myChart.setOption(option);

        return () => {
            myChart.dispose();
        };
    }, [priceChangePerDayOfWeekData.isFetched]);

    return (
        <div id="heatmap-container">
            <div ref={chartRef} style={{width: '100% !important', height: '400px'}} />
        </div>
    );
};

export default memo(PriceChangePerDayOfWeek);
