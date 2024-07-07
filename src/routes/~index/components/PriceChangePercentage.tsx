import ReactEcharts from 'echarts-for-react';
import {useEffect, useRef, useState} from 'react';

import ChartContainer from '@/components/ChartContainer';
import CustomSelect from '@/components/Select';

import {usePriceChangePercentage} from '../api';
import type {PriceChangePerDayOfWeekPropsType} from '../types';

const PriceChangePercentage = (props: PriceChangePerDayOfWeekPropsType) => {
    const {symbol, tf, tickerOptions, timeFrameOptions, type} = props;

    const [selectedTicker, setSelectedTicker] = useState(symbol);
    const [selectedTf, setSelectedTf] = useState(tf);
    const chartRef = useRef<ReactEcharts | null>(null);
    const chartInstance = chartRef.current?.getEchartsInstance();

    const priceChangePercentageApi = usePriceChangePercentage(selectedTicker, selectedTf, type);

    let title;
    if (type === 'day') title = 'Average price change per day of week';
    else if (type === 'hour') title = 'Average price change per hour of day (UTC)';

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

    useEffect(() => {
        chartInstance?.resize();
    }, [priceChangePercentageApi.data]);

    return (
        <ChartContainer
            body={
                <ReactEcharts
                    option={option}
                    ref={(e) => (chartRef.current = e)}
                    style={{height: '92%', width: '100%'}}
                />
            }
            header={
                <>
                    <h3 className="text-gray-300">{title}</h3>
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
