// @ts-expect-error - echarts-gl does not provide type definitions
import { Scatter3DChart } from 'echarts-gl/charts';
// @ts-expect-error - echarts-gl does not provide type definitions
import { Grid3DComponent } from 'echarts-gl/components';
import { BarChart, HeatmapChart, LineChart, ScatterChart, TreemapChart } from 'echarts/charts';
import {
    DatasetComponent,
    DataZoomComponent,
    GraphicComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
    TooltipComponent,
    VisualMapComponent,
    ToolboxComponent,
    AxisPointerComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-gl';

import { fontSize, palette, seriesExtra, TERMINAL_FONT, withAlpha } from './theme';

echarts.use([
    BarChart,
    HeatmapChart,
    LineChart,
    ScatterChart,
    TreemapChart,
    DatasetComponent,
    DataZoomComponent,
    GraphicComponent,
    GridComponent,
    LegendComponent,
    TitleComponent,
    TooltipComponent,
    VisualMapComponent,
    ToolboxComponent,
    CanvasRenderer,
    Scatter3DChart,
    Grid3DComponent,
    AxisPointerComponent,
]);

export const ECHARTS_THEME = 'terminal';

const axisDefaults = {
    axisLine: { lineStyle: { color: palette.bd } },
    axisTick: { lineStyle: { color: palette.bd } },
    axisLabel: { color: palette.fgDim, fontFamily: TERMINAL_FONT, fontSize: fontSize.base },
    splitLine: { lineStyle: { color: palette.grid } },
    splitArea: { areaStyle: { color: ['transparent', 'transparent'] } },
};

echarts.registerTheme(ECHARTS_THEME, {
    color: [palette.ac, palette.up, palette.heatLo, palette.down, palette.ac2, ...seriesExtra],
    backgroundColor: 'transparent',
    textStyle: { color: palette.fg, fontFamily: TERMINAL_FONT, fontSize: fontSize.base },
    title: {
        textStyle: { color: palette.fg, fontFamily: TERMINAL_FONT },
        subtextStyle: { color: palette.fgDim, fontFamily: TERMINAL_FONT },
    },
    line: {
        itemStyle: { borderWidth: 1 },
        lineStyle: { width: 1.6 },
        symbolSize: 5,
        symbol: 'circle',
        smooth: false,
    },
    bar: { itemStyle: { barBorderWidth: 0 } },
    scatter: { itemStyle: { borderWidth: 0 } },
    legend: {
        textStyle: { color: palette.fg, fontFamily: TERMINAL_FONT, fontSize: fontSize.base },
        inactiveColor: palette.fgDim,
    },
    tooltip: {
        backgroundColor: palette.bgPanel,
        borderColor: palette.bd,
        borderWidth: 1,
        textStyle: { color: palette.fg, fontFamily: TERMINAL_FONT, fontSize: fontSize.base },
        axisPointer: {
            lineStyle: { color: palette.ac, width: 1, type: 'dashed' },
            crossStyle: { color: palette.ac, width: 1, type: 'dashed' },
        },
    },
    valueAxis: axisDefaults,
    categoryAxis: axisDefaults,
    timeAxis: axisDefaults,
    logAxis: axisDefaults,
    toolbox: {
        iconStyle: { borderColor: palette.fgDim },
        emphasis: { iconStyle: { borderColor: palette.ac } },
    },
    dataZoom: {
        backgroundColor: 'transparent',
        dataBackgroundColor: withAlpha(palette.fg, 0.15),
        fillerColor: withAlpha(palette.ac, 0.18),
        handleColor: palette.ac,
        handleSize: '100%',
        textStyle: { color: palette.fgDim, fontFamily: TERMINAL_FONT },
    },
    visualMap: {
        textStyle: { color: palette.fg, fontFamily: TERMINAL_FONT, fontSize: fontSize.base },
    },
    timeline: {
        lineStyle: { color: palette.bd },
        itemStyle: { color: palette.ac, borderColor: palette.ac },
        controlStyle: { color: palette.ac, borderColor: palette.ac },
        checkpointStyle: { color: palette.ac, borderColor: palette.ac },
        label: { color: palette.fgDim, fontFamily: TERMINAL_FONT },
    },
});

export { echarts };
