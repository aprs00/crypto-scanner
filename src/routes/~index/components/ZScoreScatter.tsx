import type { SeriesOption } from 'echarts';

import ChartContainer from '@/components/Charts/ChartContainer';
import CSScatter from '@/components/Charts/CSScatter';
import CSSelect from '@/components/UI/CSSelect';
import ExchangeSelector from '@/components/UI/ExchangeSelector';

import { useZScoreScatter } from '../api';
import { ContractType, Exchange, ExchangeChartConfig } from '../types';
import MultiSelectDrawer from './MultiSelectDrawer';

export type ScatterProps = {
    exchange: Exchange;
    contractType: ContractType;
    xAxis: string;
    yAxis: string;
    hours: string;
    symbols: string[];
    symbolOptions: string[];
    defaultSymbols?: string[];
    hoursOptions: Record<string, string>;
    onRemoveClick: () => void;
    onExchangeChange: (exchange: Exchange) => void;
    onConfigChange: (config: ExchangeChartConfig) => void;
};

const ZScoreScatter = (props: ScatterProps) => {
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
        onRemoveClick,
        onExchangeChange,
        onConfigChange,
    } = props;

    const zScoreScatter = useZScoreScatter({ exchange, contractType, hours, xAxis, yAxis, symbols });

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
        <ChartContainer controls={controls} onRemoveClick={onRemoveClick} title="Z Score">
            <CSScatter data={scatterData} xAxis={xAxis} yAxis={yAxis} />
        </ChartContainer>
    );
};

export default ZScoreScatter;
