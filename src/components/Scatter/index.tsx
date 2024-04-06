import ReactEcharts from 'echarts-for-react';

import {ScatterPropsType} from './types';

const Scatter = (props: ScatterPropsType) => {
    const {data, xAxis, yAxis} = props;

    const option = {
        dataZoom: {
            type: 'inside',
        },
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
        series: data,
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

    return <ReactEcharts option={option} style={{height: '93%', width: '100%'}} />;
};

export default Scatter;
