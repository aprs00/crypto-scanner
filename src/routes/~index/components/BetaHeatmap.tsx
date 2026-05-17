import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';

import type { DataType, ExchangeChartConfig, ExchangeInfo } from '../types';

import { useBetaHeatmapData } from '../api';
import { ChartType } from '../types';
import MultiSelectDrawer from './MultiSelectDrawer';

export type BetaHeatmapProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    hours: string;
    dataType: DataType;
    symbols: string[];
    symbolOptions: string[];
    defaultSymbols?: string[];
    hoursOptions: Record<string, string>;
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
        typeOptions,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const betaHeatmap = useBetaHeatmapData({ exchange, hours, symbols, type: dataType });

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
                onChange={(dataType) => {
                    onConfigChange({ dataType });
                }}
                options={typeOptions}
                value={dataType}
            />
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer chartType={ChartType.BetaHeatmap} controls={controls} onRemoveClick={onRemoveClick}>
            <CSHeatmap data={betaHeatmap.data} />
        </ChartContainer>
    );
};

export default BetaHeatmap;
