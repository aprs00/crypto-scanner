import {memo, useState} from 'react';
import ReactEcharts from 'echarts-for-react';

import ChartContainer from './ChartContainer';
import CustomSelect from '@/components/Select';

import {usePriceChangePerDayOfWeek} from '../api';
import type {PriceChangePerDayOfWeekPropsType} from '../types';

const PriceChangePerDayOfWeek = (props: PriceChangePerDayOfWeekPropsType) => {
    const {tf, options} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const priceChangePerDayOfWeekData = usePriceChangePerDayOfWeek(selectedTf);

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
                    <h3>BTC average price change per day of week: {tf}</h3>
                    <div className="z-50">
                        <CustomSelect
                            options={options || []}
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
