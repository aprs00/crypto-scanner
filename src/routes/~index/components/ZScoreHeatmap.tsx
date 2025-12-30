import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';

import type { ContractType, DataType, Exchange, ExchangeChartConfig } from '../types';

import { useZScoreHeatmap } from '../api';

export type ZScoreHeatmapProps = {
    exchange: Exchange;
    contractType: ContractType;
    hours: string;
    dataType: DataType;
    typeOptions: Array<DataType>;
    hoursOptions: Record<string, string>;
    onAddClick: () => void;
    onRemoveClick?: () => void;
    onExchangeChange: (exchange: Exchange) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const ZScoreHeatmap = (props: ZScoreHeatmapProps) => {
    const {
        exchange,
        contractType,
        hours,
        dataType,
        typeOptions,
        hoursOptions,
        onAddClick,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const heatmap = useZScoreHeatmap({ exchange, contractType, type: dataType, hours });

    const controls = (
        <>
            <CSSelect<string>
                onChange={(hours) => {
                    onConfigChange({ hours });
                }}
                options={hoursOptions}
                value={hours}
            />
            <CSSelect<DataType>
                classes="w-24"
                onChange={(dataType) => onConfigChange({ dataType })}
                options={typeOptions}
                value={dataType}
            />
            <ExchangeSelector onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer
            controls={controls}
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
            title="Z Score Heatmap"
        >
            <CSHeatmap data={heatmap.data} visualMax={2} visualMin={-2} />
        </ChartContainer>
    );
};

export default ZScoreHeatmap;
