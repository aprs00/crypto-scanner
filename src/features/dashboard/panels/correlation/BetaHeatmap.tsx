import CSSelect from '@/components/UI/CSSelect';

import type { DataType, ExchangeChartConfig, ExchangeInfo } from '../shared/data/types';

import ChartContainer from '../shared/charting/ChartContainer';
import CSHeatmap from '../shared/charting/CSHeatmap';
import { useBetaHeatmapData } from '../shared/data/api';
import ExchangeSelector from '../shared/ExchangeSelector';
import MultiSelectDrawer from '../shared/MultiSelectDrawer/MultiSelectDrawer';

type BetaHeatmapProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    hours: string;
    dataType: DataType;
    symbols: string[];
    symbolOptions: string[];
    defaultSymbols?: string[];
    hoursOptions: Record<string, string>;
    title: string;
    typeOptions: Array<DataType>;
    onRemoveClick: () => void;
    onExchangeChange: (exchange: string) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const BetaHeatmap = (props: BetaHeatmapProps) => {
    const {
        exchange,
        exchanges,
        hours,
        dataType,
        symbols,
        symbolOptions,
        defaultSymbols,
        hoursOptions,
        title,
        typeOptions,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const betaHeatmap = useBetaHeatmapData({ exchange, hours, symbols, type: dataType });

    const handleSymbolsChange = (nextSymbols: string[]) => onConfigChange({ symbols: nextSymbols });
    const handleHoursChange = (nextHours: string) => onConfigChange({ hours: nextHours });
    const handleDataTypeChange = (nextDataType: DataType) => onConfigChange({ dataType: nextDataType });

    const controls = (
        <>
            <MultiSelectDrawer
                ariaLabel="Symbols"
                classes="w-32"
                defaultValue={defaultSymbols}
                onChange={handleSymbolsChange}
                options={symbolOptions}
                title="Select symbols"
                value={symbols}
            />
            <CSSelect<string>
                ariaLabel="Time range"
                onChange={handleHoursChange}
                options={hoursOptions}
                value={hours}
            />
            <CSSelect<DataType>
                ariaLabel="Data type"
                classes="w-24"
                onChange={handleDataTypeChange}
                options={typeOptions}
                value={dataType}
            />
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title={title}>
            <CSHeatmap data={betaHeatmap.data} />
        </ChartContainer>
    );
};

export default BetaHeatmap;
