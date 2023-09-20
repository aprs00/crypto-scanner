import {memo, useState} from 'react';
import ReactEcharts from 'echarts-for-react';

import ChartContainer from './ChartContainer';
import CustomSelect from '@/components/Select';

import {usePriceChangePerDayOfWeek, useFetchTickersOptions} from '../api';
import type {PriceChangePerDayOfWeekPropsType} from '../types';

const PriceChangePerDayOfWeek = (props: PriceChangePerDayOfWeekPropsType) => {
    const {tf, symbol, selectOptions} = props;

    const [selectedTf, setSelectedTf] = useState(tf);
    const [selectedTicker, setSelectedTicker] = useState(symbol);

    const tickersOptions = useFetchTickersOptions();
    const priceChangePerDayOfWeekData = usePriceChangePerDayOfWeek(selectedTicker, selectedTf);

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
            data: priceChangePerDayOfWeekData?.data?.xAxis,
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value}%',
            },
        },
        series: [
            {
                data: priceChangePerDayOfWeekData?.data?.data,
                type: 'bar',
            },
        ],
    };

    return (
        <ChartContainer
            header={
                <>
                    <h3>Average price change per day of week</h3>
                    <div className="z-50 flex gap-2">
                        <CustomSelect
                            options={tickersOptions?.data || []}
                            value={selectedTicker}
                            onChange={setSelectedTicker}
                            classes="w-32"
                        />
                        <CustomSelect
                            options={selectOptions || []}
                            value={selectedTf}
                            onChange={(e) => {
                                setSelectedTf(e as string);
                            }}
                        />
                    </div>
                </>
            }
            body={<ReactEcharts option={option} style={{width: '100%', height: '92%'}}></ReactEcharts>}
        />
    );
};

export default memo(PriceChangePerDayOfWeek);
