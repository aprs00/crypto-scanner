import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';

import type { ContractType, DataType, Exchange, ExchangeChartConfig } from '../types';

import { useZScoreHeatmap } from '../api';
import MultiSelectDrawer from './MultiSelectDrawer';

export type ZScoreHeatmapProps = {
    exchange: Exchange;
    contractType: ContractType;
    hours: string;
    dataType: DataType;
    symbols: string[];
    symbolOptions: string[];
    defaultSymbols?: string[];
    typeOptions: Array<DataType>;
    hoursOptions: Record<string, string>;
    onRemoveClick: () => void;
    onExchangeChange: (exchange: Exchange) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const ZScoreHeatmap = (props: ZScoreHeatmapProps) => {
    const {
        exchange,
        contractType,
        hours,
        dataType,
        symbols,
        symbolOptions,
        defaultSymbols,
        typeOptions,
        hoursOptions,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const heatmap = useZScoreHeatmap({ exchange, contractType, type: dataType, hours, symbols });

    const controls = (
        <>
            <MultiSelectDrawer
                classes="w-32"
                defaultValue={defaultSymbols}
                onChange={(nextSymbols) => {
                    onConfigChange({ symbols: nextSymbols });
                }}
                options={symbolOptions}
                title="Select symbols"
                value={symbols}
            />
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
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title="Z Score Heatmap">
            <CSHeatmap data={heatmap.data} visualMax={2} visualMin={-2} />
        </ChartContainer>
    );
};

export default ZScoreHeatmap;
