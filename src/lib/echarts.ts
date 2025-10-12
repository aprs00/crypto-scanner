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
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

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
]);

export { echarts };
