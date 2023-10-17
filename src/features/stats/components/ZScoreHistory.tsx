import {useState} from 'react';
import ReactEcharts from 'echarts-for-react';

import CustomSelect from '@/components/Select';
import ChartContainer from './ChartContainer';

import {useZScoreHistory} from '../api';
import type {ZScoreHistoryPropsType} from '../types';

const ZScoreHistory = (props: ZScoreHistoryPropsType) => {
    const {timeFrameOptions, tf, type} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const zScoreHistory = useZScoreHistory(type, selectedTf);

    const option = {
        tooltip: {
            trigger: 'axis',
        },
        legend: {
            top: '10',
            left: '15',
            type: 'scroll',
            textStyle: {
                color: '#d1d5db',
            },
            itemStyle: {
                borderWidth: 100,
                borderJoin: 'miter',
            },
        },
        // toolbox: {
        //     feature: {
        //         saveAsImage: {},
        //     },
        // },
        // dataZoom: {
        //     type: 'inside',
        // },
        grid: {
            left: '15',
            right: '15',
            bottom: '0',
            containLabel: true,
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: {
                    color: '#334155',
                },
            },
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: zScoreHistory?.data?.xAxis,
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
                },
            },
        },
        series: zScoreHistory?.data?.data,
    };

    return (
        <ChartContainer
            header={
                <>
                    <h3 className="text-gray-300">
                        Z-Score - {`${type.slice(0, 1).toUpperCase()}${type.slice(1)}`} - {tf} (UTC)
                    </h3>
                    {/* <div className="z-50 flex gap-2">
                        <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                    </div> */}
                </>
            }
            body={<ReactEcharts option={option} style={{width: '100%', height: '92%'}}></ReactEcharts>}
        />
    );
};

export default ZScoreHistory;
