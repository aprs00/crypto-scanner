import ReactEcharts from 'echarts-for-react';
import {useRef, useState} from 'react';

import ChartContainer from '@/components/Charts/ChartContainer';
import type {SelectOption} from '@/types/api';

import {usePriceChangePercentage} from '../api';

export type PriceChangePercentageProps = {
    tf: string;
    symbol: string;
    timeFrameOptions: SelectOption[];
    tickerOptions: SelectOption[];
    type: 'day' | 'hour';
    onAddClick?: () => void;
    onRemoveClick?: () => void;
};

const PriceChangePercentage = (props: PriceChangePercentageProps) => {
    const {symbol, tf, tickerOptions, timeFrameOptions, type, onAddClick, onRemoveClick} = props;

    const [selectedTicker, setSelectedTicker] = useState(symbol);
    const [selectedTf, setSelectedTf] = useState(tf);
    const chartRef = useRef<ReactEcharts | null>(null);
    // const chartInstance = chartRef.current?.getEchartsInstance();

    const priceChangePercentageApi = usePriceChangePercentage({
        duration: selectedTf,
        symbol: selectedTicker,
        type,
    });

    const titleMapper = {
        day: 'Average price change per day of week',
        hour: 'Average price change per hour of day (UTC)',
    };

    const selects = [
        {
            class: 'w-28',
            componentName: 'select',
            id: '1',
            onChange: setSelectedTicker,
            options: tickerOptions,
            value: selectedTicker,
        },
        {
            componentName: 'select',
            id: '2',
            onChange: setSelectedTf,
            options: timeFrameOptions,
            value: selectedTf,
        },
    ];

    const option = {
        grid: {bottom: 60, left: 45, right: 20, top: 20},
        series: [
            {
                data: priceChangePercentageApi.data?.data,
                type: 'bar',
            },
        ],
        tooltip: {
            axisPointer: {
                type: 'shadow-sm',
            },
            formatter: function (params: any) {
                return `${params[0].marker}${params[0].name}: ${params[0].value}%`;
            },
            trigger: 'axis',
        },
        xAxis: {
            data: priceChangePercentageApi.data?.xAxis,
            type: 'category',
        },
        yAxis: {
            axisLabel: {
                formatter: '{value}%',
            },
            splitLine: {
                lineStyle: {
                    color: '#334155',
                },
            },
            type: 'value',
        },
    };

    // setTimeout(() => chartInstance?.resize());
    //
    // useEffect(() => {
    //     chartInstance?.resize();
    // }, [priceChangePercentageApi.data]);

    return (
        <ChartContainer
            body={
                <ReactEcharts
                    option={option}
                    ref={(e) => (chartRef.current = e)}
                    style={{height: '100%', width: '100%'}}
                />
            }
            selects={selects}
            title={titleMapper[type]}
            onAddClick={onAddClick}
            onRemoveClick={onRemoveClick}
        />
    );
};

export default PriceChangePercentage;
