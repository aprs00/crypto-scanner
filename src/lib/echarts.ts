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

export { echarts };
