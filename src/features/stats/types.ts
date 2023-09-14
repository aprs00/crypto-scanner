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

export type SelectOptionsResponseType = {
    value: string;
    label: string;
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
