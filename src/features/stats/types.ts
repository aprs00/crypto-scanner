export type SelectOptionType = {
    value: string;
    label: string;
}

//
// RESPONSE TYPES
//
export type BetaHeatmapResponseType = {
    data: [[number, number, number]][];
    xAxis: string[];
    yAxis: string[];
}

export type AveragePriceChangeResponseType = {
    data: {
        value: number;
        itemStyle: {
            color: string
        }
    }[];
    xAxis: string[];
}

export type SelectOptionsResponseType = {
    all: SelectOptionType[];
    ltf: SelectOptionType[]
    htf: SelectOptionType[]
}

export type ZScoreHistoryResponseType = {
    legend: string[];
    data: {
        name: string;
        stack: string;
        data: number[];
    }[]
    xAxis: string[];
}

export type ZScoreMatrixResponseType = {
    type: string;
    name: string;
    data: [string, string][],
    color: string;
    symbolSize: number;
}

//
// PROP TYPES
//
export type ChartContainerPropsType = {
    header: JSX.Element;
    body: JSX.Element;
};

export type BetaHeatmapPropsType = {
    tf: string;
    timeFrameOptions: SelectOptionType[];
}

export type PriceChangePerDayOfWeekPropsType = {
    tf: string;
    symbol: string;
    timeFrameOptions: SelectOptionType[];
    tickerOptions: SelectOptionType[];
    type: string;   
}

export type ScatterPropsType = {
    timeFrameOptions: SelectOptionType[];
    xAxis: string;
    yAxis: string;
    tf: string;
}

export type ZScoreHistoryPropsType = {
    timeFrameOptions: SelectOptionType[];
    tf: string;
    type: string;
}