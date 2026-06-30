import { color } from 'echarts';
import { capitalize } from 'lodash-es';
import { useRef } from 'react';

import { echarts, ECHARTS_THEME } from '@/lib/echarts';
import { ReactEChartsCore } from '@/lib/ReactECharts';
import { fontSize, fontWeightSemibold, palette, TERMINAL_FONT } from '@/lib/theme';
import { resizeEChart } from '@/utils/chart';

export type Scatter3DProps = {
    data: Array<{ name: string; data: Array<[number, number, number]> }>;
    xAxis: string;
    yAxis: string;
    zAxis: string;
};

const axisNameStyle = {
    color: palette.fg,
    fontFamily: TERMINAL_FONT,
    fontSize: fontSize.lg,
    fontWeight: fontWeightSemibold,
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
            axisLine: { lineStyle: { color: palette.bd } },
            axisLabel: { color: palette.fgDim, fontFamily: TERMINAL_FONT },
            axisPointer: { lineStyle: { color: palette.ac } },
            splitLine: { lineStyle: { color: palette.grid } },
            viewControl: { autoRotate: false, distance: 200 },
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
                label: { show: false },
            },
        ],
        xAxis3D: {
            name: capitalize(xAxis).toUpperCase(),
            nameTextStyle: axisNameStyle,
            type: 'value',
        },
        yAxis3D: {
            name: capitalize(yAxis).toUpperCase(),
            nameTextStyle: axisNameStyle,
            type: 'value',
        },
        zAxis3D: {
            name: capitalize(zAxis).toUpperCase(),
            nameTextStyle: axisNameStyle,
            type: 'value',
        },
    };

    return (
        <ReactEChartsCore
            echarts={echarts}
            onChartReady={() => resizeEChart(chartRef)}
            option={option}
            ref={chartRef}
            style={{ height: '100%', width: '100%' }}
            theme={ECHARTS_THEME}
        />
    );
};

export default CSScatter3D;
