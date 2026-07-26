import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';

import type { DataType, ExchangeChartConfig, ExchangeInfo } from '../types';

import { useZScoreHeatmap } from '../api';
import { ChartType } from '../types';
import MultiSelectDrawer from './MultiSelectDrawer';

export type ZScoreHeatmapProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    hours: string;
    dataType: DataType;
    symbols: string[];
    symbolOptions: string[];
    defaultSymbols?: string[];
    typeOptions: Array<DataType>;
    hoursOptions: Record<string, string>;
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
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const heatmap = useZScoreHeatmap({ exchange, type: dataType, hours, symbols });

    const controls = (
        <>
            <MultiSelectDrawer
                ariaLabel="Symbols"
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
                ariaLabel="Time range"
                onChange={(hours) => {
                    onConfigChange({ hours });
                }}
                options={hoursOptions}
                value={hours}
            />
            <CSSelect<DataType>
                ariaLabel="Data type"
                classes="w-24"
                onChange={(dataType) => onConfigChange({ dataType })}
                options={typeOptions}
                value={dataType}
            />
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer chartType={ChartType.ZScoreHeatmap} controls={controls} onRemoveClick={onRemoveClick}>
            <CSHeatmap data={heatmap.data} visualMax={2} visualMin={-2} />
        </ChartContainer>
    );
};

export default ZScoreHeatmap;
