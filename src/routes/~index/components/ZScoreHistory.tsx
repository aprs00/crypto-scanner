import ReactEcharts from 'echarts-for-react';

import ChartContainer from '@/components/ChartContainer';

import {useZScoreHistory} from '../api';
import type {ZScoreHistoryPropsType} from '../types';

const ZScoreHistory = (props: ZScoreHistoryPropsType) => {
    const {tf, type} = props;

    const zScoreHistory = useZScoreHistory(type, tf);

    const option = {
        // },
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
        series: zScoreHistory?.data?.data,
        tooltip: {
            trigger: 'axis',
        },
        xAxis: {
            boundaryGap: false,
            data: zScoreHistory?.data?.xAxis,
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
                        Z-Score - {`${type.slice(0, 1).toUpperCase()}${type.slice(1)}`} - {tf} (UTC)
                    </h3>
                </>
            }
        />
    );
};

export default ZScoreHistory;
