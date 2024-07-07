import ReactEcharts from 'echarts-for-react';
import {capitalize} from 'lodash-es';
import {useEffect, useRef} from 'react';

import {ScatterPropsType} from './types';

const Scatter = (props: ScatterPropsType) => {
    const {data, xAxis, yAxis} = props;

    const chartRef = useRef<ReactEcharts | null>(null);
    const chartInstance = chartRef.current?.getEchartsInstance();

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
                    text: capitalize(yAxis),
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
                    text: capitalize(xAxis),
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
                return `
                    ${params.marker}${params.seriesName}
                    <br />
                    <span>${capitalize(xAxis)}: ${params.data[0]} ${capitalize(yAxis)}: ${params.data[1]}</span>
                `;
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

    useEffect(() => {
        chartInstance?.resize();
    }, [data]);

    return <ReactEcharts option={option} ref={(e) => (chartRef.current = e)} style={{height: '93%', width: '100%'}} />;
};

export default Scatter;
