import ReactEcharts from 'echarts-for-react';
import {useEffect, useRef, useState} from 'react';

import {ChartContainer} from '@/components/Charts';
import {CustomSelect} from '@/components/UI';

import {usePriceChangePercentage} from '../api';
import type {PriceChangePercentageProps} from '../types';

const PriceChangePercentage = (props: PriceChangePercentageProps) => {
    const {symbol, tf, tickerOptions, timeFrameOptions, type} = props;

    const [selectedTicker, setSelectedTicker] = useState(symbol);
    const [selectedTf, setSelectedTf] = useState(tf);
    const chartRef = useRef<ReactEcharts | null>(null);
    const chartInstance = chartRef.current?.getEchartsInstance();

    const priceChangePercentageApi = usePriceChangePercentage(selectedTicker, selectedTf, type);

    const titleMapper = {
        day: 'Average price change per day of week',
        hour: 'Average price change per hour of day (UTC)',
    };

    const option = {
        grid: {bottom: 60, left: 45, right: 20, top: 20},
        series: [
            {
                data: priceChangePercentageApi.data?.data,
                type: 'bar',
            },
        ],
        tooltip: {
            axisPointer: {
                type: 'shadow',
            },
            formatter: function (params: any) {
                return `${params[0].marker}${params[0].name}: ${params[0].value}%`;
            },
            trigger: 'axis',
        },
        xAxis: {
            data: priceChangePercentageApi.data?.xAxis,
            type: 'category',
        },
        yAxis: {
            axisLabel: {
                formatter: '{value}%',
            },
            splitLine: {
                lineStyle: {
                    color: '#334155',
                },
            },
            type: 'value',
        },
    };

    setTimeout(() => chartInstance?.resize());

    useEffect(() => {
        chartInstance?.resize();
    }, [priceChangePercentageApi.data]);

    return (
        <ChartContainer
            body={
                <ReactEcharts
                    option={option}
                    ref={(e) => (chartRef.current = e)}
                    style={{height: '100%', width: '100%'}}
                />
            }
            header={
                <>
                    <h3 className="text-gray-300">{titleMapper[type]}</h3>
                    <div className="z-50 flex gap-2">
                        <CustomSelect
                            classes="w-32"
                            options={tickerOptions}
                            value={selectedTicker}
                            onChange={setSelectedTicker}
                        />
                        <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                    </div>
                </>
            }
        />
    );
};

export default PriceChangePercentage;
