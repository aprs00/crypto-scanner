import ChartContainer from '@/components/Charts/ChartContainer';
import CSScatter from '@/components/Charts/CSScatter';
import { memo } from 'react';

import { useZScoreMatrix } from '../api';
import { ChartConfig } from '../types';

export type ScatterProps = {
    xAxis: string;
    yAxis: string;
    hours: string;
    hoursOptions: Record<string, string>;
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const ZScoreMatrix = (props: ScatterProps) => {
    const { hours, hoursOptions, xAxis, yAxis, onAddClick, onRemoveClick, onConfigChange } = props;

    const zScoreMatrix = useZScoreMatrix({
        hours,
        xAxis,
        yAxis,
    });

    const scatterData: echarts.SeriesOption[] =
        zScoreMatrix.data?.map((item) => ({
            type: 'scatter',
            name: item.symbol,
            data: [item.data],
            symbolSize: 20,
            emphasis: { scale: 1.6 },
        })) || [];

    const selects = [
        {
            componentName: 'select',
            onChange: (hours: string) => {
                onConfigChange?.({ hours });
            },
            options: hoursOptions,
            value: hours,
        },
    ];

    return (
        <ChartContainer
            body={<CSScatter data={scatterData || []} xAxis={xAxis} yAxis={yAxis} />}
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            selects={selects}
            title="Z Score"
        />
    );
};

export default memo(ZScoreMatrix);
