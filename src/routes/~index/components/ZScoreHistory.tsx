import ChartContainer from '@/components/Charts/ChartContainer';
import { useCorrelationTypeOptions } from '@/routes/~correlations/api';
import { resizeEChart } from '@/utils/chart';
import ReactEcharts, { type EChartsOption } from 'echarts-for-react';
import { useRef } from 'react';

import { useZScoreHistory } from '../api';
import { ChartConfig } from '../types';

export type ZScoreHistoryProps = {
    type: string;
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const tf = '12h';

const ZScoreHistory = (props: ZScoreHistoryProps) => {
    const { type, onAddClick, onRemoveClick, onConfigChange } = props;

    const chartRef = useRef<ReactEcharts | null>(null);

    const zScoreHistory = useZScoreHistory({
        duration: tf,
        type: type,
    });
    const typeOptions = useCorrelationTypeOptions();

    const option: EChartsOption = {
        grid: {
            bottom: '0',
            containLabel: true,
            left: '15',
            right: '15',
        },
        legend: {
            itemStyle: {
                borderJoin: 'miter',
                borderWidth: 100,
            },
            left: '15',
            textStyle: {
                color: '#d1d5db',
            },
            top: '10',
            type: 'scroll',
        },
        series: zScoreHistory.data?.data,
        tooltip: {
            trigger: 'axis',
        },
        xAxis: {
            boundaryGap: false,
            data: zScoreHistory.data?.xAxis,
            splitLine: {
                lineStyle: {
                    color: '#1e293b',
                },
            },
            type: 'category',
        },
        yAxis: {
            splitLine: {
                lineStyle: {
                    color: '#334155',
                },
            },
            type: 'value',
        },
    };

    return (
        <ChartContainer
            body={
                <ReactEcharts
                    onChartReady={() => resizeEChart(chartRef)}
                    option={option}
                    ref={chartRef}
                    style={{ height: '92%', width: '100%' }}
                />
            }
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            selects={[
                {
                    class: 'w-24',
                    componentName: 'select',
                    id: '1',
                    onChange: (val: string) => {
                        onConfigChange?.({ type: val });
                    },
                    options: typeOptions.data || [],
                    value: type,
                },
            ]}
            title={`Z Score - ${tf} (UTC)`}
        />
    );
};

export default ZScoreHistory;
