// The GL extension is intentionally registered only from the 3D panel's lazy
// entry point. Importing the standard chart runtime must not pull WebGL into
// every dashboard panel.
// @ts-expect-error -- echarts-gl does not publish TypeScript declarations.
import { Scatter3DChart } from 'echarts-gl/charts';
// @ts-expect-error -- echarts-gl does not publish TypeScript declarations.
import { Grid3DComponent } from 'echarts-gl/components';
import 'echarts-gl';

import { echarts, ECHARTS_THEME } from './echarts';

echarts.use([Grid3DComponent, Scatter3DChart]);

export { echarts, ECHARTS_THEME };
