import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import CSMultiSelectModal from '@/components/UI/CSMultiSelectModal';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';

import type { ContractType, DataType, Exchange, ExchangeChartConfig } from '../types';

import { useBetaHeatmapData } from '../api';

export type BetaHeatmapProps = {
    exchange: Exchange;
    contractType: ContractType;
    hours: string;
    dataType: DataType;
    symbols: string[];
    symbolOptions: string[];
    hoursOptions: Record<string, string>;
    typeOptions: Array<DataType>;
    onAddClick: () => void;
    onRemoveClick?: () => void;
    onExchangeChange: (exchange: Exchange) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const BetaHeatmap = (props: BetaHeatmapProps) => {
    const {
        exchange,
        contractType,
        hours,
        dataType,
        symbols,
        symbolOptions,
        hoursOptions,
        typeOptions,
        onAddClick,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const betaHeatmap = useBetaHeatmapData({ exchange, contractType, hours, symbols, type: dataType });

    const controls = (
        <>
            <CSMultiSelectModal
                classes="w-32"
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
                onChange={(dataType) => {
                    onConfigChange({ dataType });
                }}
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
            title="Pearson correlation"
        >
            <CSHeatmap data={betaHeatmap.data} />
        </ChartContainer>
    );
};

export default BetaHeatmap;
