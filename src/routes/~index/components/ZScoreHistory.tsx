import ReactEcharts from 'echarts-for-react';
import {capitalize} from 'lodash-es';

import {ChartContainer} from '@/components/Charts';

import {useZScoreHistory} from '../api';
import type {ZScoreHistoryProps} from '../types';

const ZScoreHistory = (props: ZScoreHistoryProps) => {
    const {tf, type} = props;

    const zScoreHistory = useZScoreHistory(type, tf);

    const option = {
        grid: {
            bottom: '0',
            containLabel: true,
            left: '15',
            right: '15',
        },
        legend: {
            itemStyle: {
                borderJoin: 'miter',
                borderWidth: 100,
            },
            left: '15',
            textStyle: {
                color: '#d1d5db',
            },
            top: '10',
            type: 'scroll',
        },
        // toolbox: {
        //     feature: {
        //         saveAsImage: {},
        //     },
        // },
        // dataZoom: {
        //     type: 'inside',
        series: zScoreHistory.data?.data,
        tooltip: {
            trigger: 'axis',
        },
        xAxis: {
            boundaryGap: false,
            data: zScoreHistory.data?.xAxis,
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
                },
            },
            type: 'category',
        },
        yAxis: {
            splitLine: {
                lineStyle: {
                    color: '#334155',
                },
            },
            type: 'value',
        },
    };

    return (
        <ChartContainer
            body={<ReactEcharts option={option} style={{height: '92%', width: '100%'}}></ReactEcharts>}
            header={
                <>
                    <h3 className="text-gray-300">
                        Z Score - {capitalize(type)} - {tf} (UTC)
                    </h3>
                </>
            }
        />
    );
};

export default ZScoreHistory;
