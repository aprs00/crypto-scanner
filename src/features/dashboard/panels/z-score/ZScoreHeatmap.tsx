import CSSelect from '@/components/UI/CSSelect';

import type { DataType, ExchangeChartConfig, ExchangeInfo } from '../shared/data/types';

import ChartContainer from '../shared/charting/ChartContainer';
import CSHeatmap from '../shared/charting/CSHeatmap';
import { useZScoreHeatmap } from '../shared/data/api';
import ExchangeSelector from '../shared/ExchangeSelector';
import MultiSelectDrawer from '../shared/MultiSelectDrawer/MultiSelectDrawer';

type ZScoreHeatmapProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    hours: string;
    dataType: DataType;
    symbols: string[];
    symbolOptions: string[];
    defaultSymbols?: string[];
    typeOptions: Array<DataType>;
    hoursOptions: Record<string, string>;
    title: string;
    onRemoveClick: () => void;
    onExchangeChange: (exchange: string) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const ZScoreHeatmap = (props: ZScoreHeatmapProps) => {
    const {
        exchange,
        exchanges,
        hours,
        dataType,
        symbols,
        symbolOptions,
        defaultSymbols,
        typeOptions,
        hoursOptions,
        title,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const heatmap = useZScoreHeatmap({ exchange, type: dataType, hours, symbols });

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
            <CSHeatmap data={heatmap.data} visualMax={2} visualMin={-2} />
        </ChartContainer>
    );
};

export default ZScoreHeatmap;
