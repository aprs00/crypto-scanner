import ChartContainer from '@/components/Charts/ChartContainer';
import CSScatter3D from '@/components/Charts/CSScatter3D';
import CSMultiSelectModal from '@/components/UI/CSMultiSelectModal';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';

import { useZScoreScatter3D } from '../api';
import { ContractType, Exchange, ExchangeChartConfig } from '../types';

export type Scatter3DProps = {
    exchange: Exchange;
    contractType: ContractType;
    xAxis: string;
    yAxis: string;
    zAxis: string;
    hours: string;
    symbols: string[];
    symbolOptions: string[];
    defaultSymbols?: string[];
    hoursOptions: Record<string, string>;
    onRemoveClick: () => void;
    onExchangeChange: (exchange: Exchange) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const ZScoreScatter3D = (props: Scatter3DProps) => {
    const {
        exchange,
        contractType,
        hours,
        symbols,
        symbolOptions,
        defaultSymbols,
        hoursOptions,
        xAxis,
        yAxis,
        zAxis,
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const zScoreScatter3D = useZScoreScatter3D({ exchange, contractType, hours, xAxis, yAxis, zAxis, symbols });

    const scatterData =
        zScoreScatter3D.data?.map((item) => ({
            name: item.symbol,
            data: [item.data],
        })) || [];

    const controls = (
        <>
            <CSMultiSelectModal
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
            <ExchangeSelector onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title="Z Score 3D">
            <CSScatter3D data={scatterData} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} />
        </ChartContainer>
    );
};

export default ZScoreScatter3D;
