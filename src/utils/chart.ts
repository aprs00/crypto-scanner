import ReactEcharts from 'echarts-for-react';
import { RefObject } from 'react';

const resizeEChart = (chartRef: RefObject<ReactEcharts | null>): void => {
    setTimeout(() => {
        if (chartRef.current) {
            chartRef.current.getEchartsInstance().resize({ height: 'auto', width: 'auto' });
        }
    }, 1);
};

export { resizeEChart };
