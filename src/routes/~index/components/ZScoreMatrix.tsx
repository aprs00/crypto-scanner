import ReactEcharts from 'echarts-for-react';
import {useState} from 'react';

import ChartContainer from '@/components/ChartContainer';
import CustomSelect from '@/components/Select';

import {useZScoreMatrix} from '../api';
import type {ScatterPropsType} from '../types';

const ZScoreMatrix = (props: ScatterPropsType) => {
    const {tf, timeFrameOptions, xAxis, yAxis} = props;

    const [selectedTf, setSelectedTf] = useState(tf);

    const zScoreMatrix = useZScoreMatrix(xAxis, yAxis, selectedTf);

    const option = {
        graphic: [
            {
                left: '10',
                rotation: Math.PI / 2,
                style: {
                    fill: '#cbd5e1',
                    fontSize: 18,
                    text: yAxis.slice(0, 1).toUpperCase() + yAxis.slice(1),
                },
                top: '44%',
                type: 'text',
            },
            {
                bottom: '1',
                left: '50%',
                style: {
                    fill: '#cbd5e1',
                    fontSize: 18,
                    text: `${xAxis.slice(0, 1).toUpperCase()}${xAxis.slice(1)}`,
                },
                type: 'text',
            },
        ],
        // dataZoom: {
        //     type: 'inside',
        grid: {
            bottom: '50',
            left: '70',
            right: '20',
            top: '60',
        },
        legend: {
            textStyle: {
                color: '#d1d5db',
            },
            top: '10',
            type: 'scroll',
        },
        series: zScoreMatrix?.data || [],
        // },
        tooltip: {
            formatter: function (params: any) {
                return `${params.marker}${params.seriesName}: <span>x: ${params.data[0]} y: ${params.data[1]}</span>`;
            },
        },
        xAxis: {
            scale: true,
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
                },
            },
            type: 'value',
        },
        yAxis: {
            scale: true,
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
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
                    <h3 className="text-gray-300">Z-Score</h3>
                    <div className="z-50 flex gap-2">
                        <CustomSelect options={timeFrameOptions} value={selectedTf} onChange={setSelectedTf} />
                    </div>
                </>
            }
        />
    );
};

export default ZScoreMatrix;
