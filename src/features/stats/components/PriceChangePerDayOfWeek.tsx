import {memo, useMemo} from 'react';
import ReactEcharts from 'echarts-for-react';
// import {queryClient} from '@/lib/react-query';

import ChartContainer from './ChartContainer';

import {usePriceChangePerDayOfWeek} from '../api';

const PriceChangePerDayOfWeek = (props: {tf: string}) => {
    const {tf = '1m'} = props;

    // const statsSelectOptions = queryClient.getQueryData(['stats-select-options']);

    const priceChangePerDayOfWeekData = usePriceChangePerDayOfWeek(tf);

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
            header={<h3>BTC average price change per day of week: {tf}</h3>}
            body={<ReactEcharts option={option} style={{width: '100%', height: '92%'}}></ReactEcharts>}
        />
    );
};

export default memo(PriceChangePerDayOfWeek);
