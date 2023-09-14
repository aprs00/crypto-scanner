import {memo, useMemo} from 'react';
import ReactEcharts from 'echarts-for-react';
import {queryClient} from '@/lib/react-query';

import CustomSelect from '@/components/Select';
import {usePriceChangePerDayOfWeek} from '../api';
import {SelectOptionsResponseType} from '../types';

const PriceChangePerDayOfWeek = (props: {tf: string}) => {
    const {tf = '1m'} = props;

    const statsSelectOptions = queryClient.getQueryData(['stats-select-options']);

    const priceChangePerDayOfWeekData = usePriceChangePerDayOfWeek(tf);

    const option = useMemo(
        () => ({
            grid: {top: 20, right: 20, bottom: 30, left: 40},
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
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

    return (
        <div className="border-2 border-slate-800 rounded m-1">
            <div className="flex justify-between items-center pl-3 py-1 rounded-t-xs bg-slate-800">
                <h3>Average price change per day of week: {tf}</h3>
                {/* <CustomSelect
                        options={statsSelectOptions || []}
                        value={tf as string}
                        onChange={(e) => {
                            // setTableAlignment(e as string);
                        }}
                    /> */}
            </div>
            <ReactEcharts option={option} style={{width: '100%', height: '400px'}}></ReactEcharts>
        </div>
    );
};

export default memo(PriceChangePerDayOfWeek);
