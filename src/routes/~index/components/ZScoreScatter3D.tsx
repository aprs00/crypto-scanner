import ChartContainer from '@/components/Charts/ChartContainer';
import CSScatter3D from '@/components/Charts/CSScatter3D';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';

import { useBootstrap, useZScoreScatter3D } from '../api';
import { ExchangeChartConfig, ExchangeInfo } from '../types';
import MultiSelectDrawer from './MultiSelectDrawer';

export type Scatter3DProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    xAxis: string;
    yAxis: string;
    zAxis: string;
    hours: string;
    symbols: string[];
    symbolOptions: string[];
    defaultSymbols?: string[];
    hoursOptions: Record<string, string>;
    onRemoveClick: () => void;
    onExchangeChange: (exchange: string) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const ZScoreScatter3D = (props: Scatter3DProps) => {
    const {
        exchange,
        exchanges,
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

    const bootstrap = useBootstrap();

    const filteredExchanges = exchanges.filter((ex) => {
        const exchangeData = bootstrap.data?.exchange_data?.[ex.id];
        return exchangeData?.data_types.length === 3;
    });

    const zScoreScatter3D = useZScoreScatter3D({ exchange, hours, xAxis, yAxis, zAxis, symbols });

    const scatterData =
        zScoreScatter3D.data?.map((item) => ({
            name: item.symbol,
            data: [item.data],
        })) || [];

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
            <ExchangeSelector exchanges={filteredExchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title="Z Score 3D">
            <CSScatter3D data={scatterData} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} />
        </ChartContainer>
    );
};

export default ZScoreScatter3D;
