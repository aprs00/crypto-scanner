import ChartContainer, { ComponentName } from '@/components/Charts/ChartContainer';
import CSScatter from '@/components/Charts/CSScatter';

import { useZScoreScatter } from '../api';
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

const ZScoreScatter = (props: ScatterProps) => {
    const { hours, hoursOptions, xAxis, yAxis, onAddClick, onRemoveClick, onConfigChange } = props;

    const zScoreScatter = useZScoreScatter({ hours, xAxis, yAxis });

    const scatterData: echarts.SeriesOption[] =
        zScoreScatter.data?.map((item) => ({
            type: 'scatter',
            name: item.symbol,
            data: [item.data],
            symbolSize: 20,
            emphasis: { scale: 1.6 },
        })) || [];

    const selects = [
        {
            componentName: ComponentName.Select,
            onChange: (hours: string) => {
                onConfigChange?.({ hours });
            },
            options: hoursOptions,
            value: hours,
        },
    ];

    return (
        <ChartContainer onAddClick={onAddClick} onRemoveClick={onRemoveClick} selects={selects} title="Z Score">
            <CSScatter data={scatterData || []} xAxis={xAxis} yAxis={yAxis} />
        </ChartContainer>
    );
};

export default ZScoreScatter;
