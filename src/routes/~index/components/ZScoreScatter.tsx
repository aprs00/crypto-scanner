import { type SeriesOption } from 'echarts';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSScatter from '@/components/Charts/CSScatter';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';

import { useZScoreScatter } from '../api';
import { ChartType, ExchangeChartConfig, ExchangeInfo } from '../types';
import MultiSelectDrawer from './MultiSelectDrawer';

export type ScatterProps = {
    exchange: string;
    exchanges: ExchangeInfo[];
    xAxis: string;
    yAxis: string;
    hours: string;
    symbols: string[];
    symbolOptions: string[];
    defaultSymbols?: string[];
    hoursOptions: Record<string, string>;
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
            <ExchangeSelector exchanges={exchanges} onChange={onExchangeChange} value={exchange} />
        </>
    );

    return (
        <ChartContainer chartType={ChartType.Scatter} controls={controls} onRemoveClick={onRemoveClick}>
            <CSScatter data={scatterData} xAxis={xAxis} yAxis={yAxis} />
        </ChartContainer>
    );
};

export default ZScoreScatter;
