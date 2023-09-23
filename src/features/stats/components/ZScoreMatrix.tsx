import {memo, useState} from 'react';
import ReactEcharts from 'echarts-for-react';

import CustomSelect from '@/components/Select';
import ChartContainer from './ChartContainer';

import {useZScoreMatrix} from '../api';
import type {ScatterPropsType} from '../types';

const ZScoreMatrix = (props: ScatterPropsType) => {
    const {timeFrameOptions, xAxis, yAxis, tf} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const zScoreMatrix = useZScoreMatrix(xAxis, yAxis, selectedTf);

    const option = {
        legend: {
            top: '10',
            textStyle: {
                color: '#d1d5db',
            },
        },
        dataZoom: {
            type: 'inside',
        },
        tooltip: {
            formatter: function (params: any) {
                return `${params.marker}${params.seriesName}: <span>x: ${params.data[0]} y: ${params.data[1]}</span>`;
            },
        },
        grid: {
            left: '70',
            right: '20',
            bottom: '55',
            top: '80',
        },
        xAxis: {
            type: 'value',
            scale: true,
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
                },
            },
        },
        yAxis: {
            type: 'value',
            scale: true,
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
                },
            },
        },
        series: zScoreMatrix?.data || [],
        graphic: [
            {
                type: 'text',
                left: '1.5%',
                top: '44%',
                style: {
                    text: yAxis.slice(0, 1).toUpperCase() + yAxis.slice(1),
                    fontSize: 18,
                    fill: '#cbd5e1',
                },
                rotation: Math.PI / 2,
            },
            {
                type: 'text',
                left: '50%',
                bottom: '1%',
                style: {
                    text: `${xAxis.slice(0, 1).toUpperCase()}${xAxis.slice(1)}`,
                    fontSize: 18,
                    fill: '#cbd5e1',
                },
            },
        ],
    };

    return (
        <ChartContainer
            header={
                <>
                    <h3 className="text-gray-300">Z-Score</h3>
                    <div className="z-50 flex gap-2">
                        <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                    </div>
                </>
            }
            body={<ReactEcharts option={option} style={{width: '100%', height: '92%'}}></ReactEcharts>}
        />
    );
};

export default memo(ZScoreMatrix);
