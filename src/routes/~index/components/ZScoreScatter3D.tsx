import ChartContainer from '@/components/Charts/ChartContainer';
import CSScatter3D from '@/components/Charts/CSScatter3D';
import CSSelect from '@/components/UI/CSSelect';

import { useZScoreScatter3D } from '../api';
import { ChartConfig } from '../types';

export type Scatter3DProps = {
    xAxis: string;
    yAxis: string;
    zAxis: string;
    hours: string;
    hoursOptions: Record<string, string>;
    onAddClick: () => void;
    onRemoveClick?: () => void;
    onConfigChange: (config: ChartConfig) => void;
};

const ZScoreScatter3D = (props: Scatter3DProps) => {
    const { hours, hoursOptions, xAxis, yAxis, zAxis, onAddClick, onRemoveClick, onConfigChange } = props;

    const zScoreScatter3D = useZScoreScatter3D({ hours, xAxis, yAxis, zAxis });

    const scatterData =
        zScoreScatter3D.data?.map((item) => ({
            name: item.symbol,
            data: [item.data],
        })) || [];

    const controls = (
        <>
            <CSSelect<string>
                onChange={(hours) => {
                    onConfigChange({ hours });
                }}
                options={hoursOptions}
                value={hours}
            />
        </>
    );

    return (
        <ChartContainer controls={controls} onAddClick={onAddClick} onRemoveClick={onRemoveClick} title="Z Score 3D">
            <CSScatter3D data={scatterData || []} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} />
        </ChartContainer>
    );
};

export default ZScoreScatter3D;
