import {memo, useState} from 'react';
import ReactEcharts from 'echarts-for-react';

import ChartContainer from './ChartContainer';
import CustomSelect from '@/components/Select';

import {usePriceChangePercentage} from '../api';
import type {PriceChangePerDayOfWeekPropsType} from '../types';

const PriceChangePercentage = (props: PriceChangePerDayOfWeekPropsType) => {
    const {tf, symbol, timeFrameOptions, tickerOptions, type} = props;

    const [selectedTicker, setSelectedTicker] = useState(symbol);
    const [selectedTf, setSelectedTf] = useState(tf);

    const priceChangePercentageApi = usePriceChangePercentage(selectedTicker, selectedTf, type);

    let title;
    if (type === 'day') title = 'Average price change per day of week';
    else if (type === 'hour') title = 'Average price change per hour of day (UTC)';

    const option = {
        grid: {top: 20, right: 20, bottom: 30, left: 45},
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow',
            },
            formatter: function (params: any) {
                return params[0].marker + params[0].name + ': ' + params[0].value + '%';
            },
        },
        xAxis: {
            type: 'category',
            data: priceChangePercentageApi?.data?.xAxis,
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value}%',
            },
            splitLine: {
                lineStyle: {
                    color: '#334155',
                },
            },
        },
        series: [
            {
                data: priceChangePercentageApi?.data?.data,
                type: 'bar',
            },
        ],
    };

    return (
        <ChartContainer
            header={
                <>
                    <h3 className="text-gray-300">{title}</h3>
                    <div className="z-50 flex gap-2">
                        <CustomSelect
                            options={tickerOptions}
                            value={selectedTicker}
                            onChange={setSelectedTicker}
                            classes="w-32"
                        />
                        <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                    </div>
                </>
            }
            body={<ReactEcharts option={option} style={{width: '100%', height: '92%'}}></ReactEcharts>}
        />
    );
};

export default memo(PriceChangePercentage);
