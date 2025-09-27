import ReactEChartsCore from 'echarts-for-react/lib/core';
import { RefObject } from 'react';

const resizeEChart = (chartRef: RefObject<ReactEChartsCore | null>): void => {
    setTimeout(() => {
        if (chartRef.current) {
            chartRef.current.getEchartsInstance().resize({ height: 'auto', width: 'auto' });
        }
    }, 1);
};

export { resizeEChart };
