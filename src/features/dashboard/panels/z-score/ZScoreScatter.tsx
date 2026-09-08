import { type SeriesOption } from 'echarts';

import CSSelect from '@/components/UI/CSSelect';

import ChartContainer from '../shared/charting/ChartContainer';
import CSScatter from '../shared/charting/CSScatter';
import { useZScoreScatter } from '../shared/data/api';
import { ExchangeChartConfig, ExchangeInfo } from '../shared/data/types';
import ExchangeSelector from '../shared/ExchangeSelector';
import MultiSelectDrawer from '../shared/MultiSelectDrawer/MultiSelectDrawer';

type ScatterProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    xAxis: string;
    yAxis: string;
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

const ZScoreScatter = (props: ScatterProps) => {
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
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const zScoreScatter = useZScoreScatter({ exchange, hours, xAxis, yAxis, symbols });

    const scatterData: SeriesOption[] =
        zScoreScatter.data?.map((item) => ({
            type: 'scatter',
            name: item.symbol,
            data: [item.data],
            symbolSize: 20,
            emphasis: { scale: 1.6 },
        })) || [];

    const handleSymbolsChange = (nextSymbols: string[]) => onConfigChange({ symbols: nextSymbols });
    const handleHoursChange = (hours: string) => onConfigChange({ hours });

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
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title={title}>
            <CSScatter data={scatterData} xAxis={xAxis} yAxis={yAxis} />
        </ChartContainer>
    );
};

export default ZScoreScatter;
