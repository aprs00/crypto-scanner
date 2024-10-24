import ReactEcharts from 'echarts-for-react';
import {capitalize} from 'lodash-es';
import {useState} from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import {useCorrelationTypeOptions} from '@/routes/~correlations/api';

import {useZScoreHistory} from '../api';

export type ZScoreHistoryProps = {
    tf: string;
};

const ZScoreHistory = (props: ZScoreHistoryProps) => {
    const {tf} = props;

    const [selectedType, setSelectedType] = useState('price');

    const zScoreHistory = useZScoreHistory({
        duration: tf,
        type: selectedType,
    });
    const typeOptions = useCorrelationTypeOptions();

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
            selects={[
                {
                    class: 'w-28',
                    componentName: 'select',
                    id: '1',
                    onChange: setSelectedType,
                    options: typeOptions.data || [],
                    value: selectedType,
                },
            ]}
            title={`Z Score - ${capitalize(selectedType)} - ${tf} (UTC)`}
        />
    );
};

export default ZScoreHistory;
