import { color } from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { capitalize } from 'lodash-es';
import { useEffect, useRef } from 'react';

import { echarts } from '@/lib/echarts';
import { resizeEChart } from '@/utils/chart';

export type Scatter3DProps = {
    data: Array<{ name: string; data: Array<[number, number, number]> }>;
    xAxis: string;
    yAxis: string;
    zAxis: string;
};

const CSScatter3D = (props: Scatter3DProps) => {
    const { data, xAxis, yAxis, zAxis } = props;
    const chartRef = useRef<ReactEChartsCore | null>(null);

    const flattenedData = data.flatMap((item) =>
        item.data.map((point) => ({
            value: point,
            name: item.name,
            itemStyle: {
                color: color.random(),
            },
        })),
    );

    const option = {
        grid3D: {
            axisLine: {
                lineStyle: {
                    color: '#cbd5e1',
                },
            },
            axisPointer: {
                lineStyle: {
                    color: '#ffbd67',
                },
            },
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
                },
            },
            viewControl: {
                autoRotate: false,
                distance: 200,
            },
        },
        tooltip: {
            show: true,
            formatter: (params: any) => {
                const [x, y, z] = params.value;
                return `${params.marker}<strong>${params.data.name}</strong><br/>${capitalize(xAxis)}: ${x}<br/>${capitalize(yAxis)}: ${y}<br/>${capitalize(zAxis)}: ${z}`;
            },
        },
        series: [
            {
                type: 'scatter3D',
                symbolSize: 12,
                data: flattenedData,
                label: {
                    show: false,
                },
            },
        ],
        xAxis3D: {
            name: capitalize(xAxis),
            nameTextStyle: {
                color: '#cbd5e1',
                fontSize: 14,
            },
            type: 'value',
        },
        yAxis3D: {
            name: capitalize(yAxis),
            nameTextStyle: {
                color: '#cbd5e1',
                fontSize: 14,
            },
            type: 'value',
        },
        zAxis3D: {
            name: capitalize(zAxis),
            nameTextStyle: {
                color: '#cbd5e1',
                fontSize: 14,
            },
            type: 'value',
        },
    };

    useEffect(() => {
        const chart = chartRef.current?.getEchartsInstance();
        chart?.on('mouseover', (params: any) => {
            console.log('Hovered:', params);
        });
    }, []);

    return (
        <ReactEChartsCore
            echarts={echarts}
            onChartReady={() => resizeEChart(chartRef)}
            option={option}
            ref={chartRef}
            style={{ height: '100%', width: '100%' }}
        />
    );
};

export default CSScatter3D;
