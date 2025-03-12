import {RefObject} from 'react';
import ReactEcharts from 'echarts-for-react';

const resizeEChart = (chartRef: RefObject<ReactEcharts | null>): void => {
    setTimeout(() => {
        if (chartRef.current) {
            chartRef.current.getEchartsInstance().resize({height: 'auto', width: 'auto'});
        }
    }, 50);
};

export {resizeEChart};
