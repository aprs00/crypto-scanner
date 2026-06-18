import { RefObject } from 'react';

import type { ReactEChartsCore } from '@/lib/ReactECharts';

const resizeEChart = (chartRef: RefObject<ReactEChartsCore | null>): void => {
    setTimeout(() => {
        if (chartRef.current) {
            chartRef.current.getEchartsInstance().resize({ height: 'auto', width: 'auto' });
        }
    }, 1);
};

export { resizeEChart };
