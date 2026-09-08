import CSSelect from '@/components/UI/CSSelect';

import ChartContainer from '../shared/charting/ChartContainer';
import CSScatter3D from '../shared/charting/CSScatter3D';
import { useBootstrap, useZScoreScatter3D } from '../shared/data/api';
import { ExchangeChartConfig, ExchangeInfo } from '../shared/data/types';
import ExchangeSelector from '../shared/ExchangeSelector';
import MultiSelectDrawer from '../shared/MultiSelectDrawer/MultiSelectDrawer';

type Scatter3DProps = {
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
    title: string;
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
        title,
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

    const handleSymbolsChange = (nextSymbols: string[]) => onConfigChange({ symbols: nextSymbols });
    const handleHoursChange = (nextHours: string) => onConfigChange({ hours: nextHours });

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
            <ExchangeSelector exchanges={filteredExchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title={title}>
            <CSScatter3D data={scatterData} xAxis={xAxis} yAxis={yAxis} zAxis={zAxis} />
        </ChartContainer>
    );
};

export default ZScoreScatter3D;
