export type TickerCalculationsType = {
    percentages: number[];
    sum: number;
    sumSq: number;
};

export type BetaHeatmapResponseType = {
    data: [[number, number, number]][];
    xAxis: string[];
    yAxis: string[];
}

export type PriceChangePerDayOfWeekResponseType = {
    data: {
        value: number;
        itemStyle: {
            color: string
        }
    }[];
    xAxis: string[];
}

export type SelectOptionType = {
    value: string;
    label: string;
}

export type SelectOptionsResponseType = {
    all: SelectOptionType[];
    ltf: SelectOptionType[]
    htf: SelectOptionType[]
}

export type ChartContainerPropsType = {
    header: JSX.Element;
    body: JSX.Element;
};

export type BetaHeatmapPropsType = {
    selectOptions: SelectOptionType[];
    tf: string;
}

export type PriceChangePerDayOfWeekPropsType = {
    tf: string;
    symbol: string;
    selectOptions: SelectOptionType[];
}

export type KlinesResponseType = [
    number,
    string,
    string,
    string,
    string,
    string,
    number,
    string,
    number,
    string,
    string,
    string,
][];
