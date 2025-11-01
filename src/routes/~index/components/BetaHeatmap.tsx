import ChartContainer from '@/components/Charts/ChartContainer';
import CSHeatmap from '@/components/Charts/CSHeatmap';
import CSSelect from '@/components/UI/CSSelect';

import type { ChartConfig, DataType } from '../types';

import { useBetaHeatmapData } from '../api';

export type BetaHeatmapProps = {
    hours: string;
    dataType: DataType;
    symbols: string[];
    symbolOptions: string[];
    hoursOptions: Record<string, string>;
    typeOptions: Array<DataType>;
    onAddClick?: () => void;
    onRemoveClick?: () => void;
    onConfigChange?: (config: ChartConfig) => void;
};

const BetaHeatmap = (props: BetaHeatmapProps) => {
    const {
        hours,
        dataType,
        symbols,
        symbolOptions,
        hoursOptions,
        typeOptions,
        onAddClick,
        onRemoveClick,
        onConfigChange,
    } = props;

    const betaHeatmap = useBetaHeatmapData({ hours, symbols, type: dataType });

    const controls = (
        <>
            <CSSelect<string>
                classes="w-32"
                multiple
                onChange={(nextSymbols: string[]) => {
                    onConfigChange?.({ symbols: nextSymbols });
                }}
                options={symbolOptions}
                value={symbols}
            />
            <CSSelect<string>
                onChange={(hours: string) => {
                    onConfigChange?.({ hours });
                }}
                options={hoursOptions}
                value={hours}
            />
            <CSSelect<DataType>
                classes="w-24"
                onChange={(dataType: DataType) => {
                    onConfigChange?.({ dataType });
                }}
                options={typeOptions}
                value={dataType}
            />
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
