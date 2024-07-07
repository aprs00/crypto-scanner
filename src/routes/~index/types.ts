export type SelectOption = {
    value: string;
    label: string;
};

export type BetaHeatmapResponse = {
    data: [[number, number, number]][];
    xAxis: string[];
    yAxis: string[];
};

export type AveragePriceChangeResponse = {
    data: {
        value: number;
        itemStyle: {
            color: string;
        };
    }[];
    xAxis: string[];
};

export type SelectOptionsResponse = {
    all: SelectOption[];
    ltf: SelectOption[];
    htf: SelectOption[];
};

export type ZScoreHistoryResponse = {
    legend: string[];
    data: {
        name: string;
        stack: string;
        data: number[];
    }[];
    xAxis: string[];
};

export type ZScoreMatrixResponse = {
    type: string;
    name: string;
    data: number[][];
    color: string;
    symbolSize: number;
};

export type BetaHeatmapProps = {
    tf: string;
    timeFrameOptions: SelectOption[];
};

export type PriceChangeTypes = 'day' | 'hour';

export type PriceChangePercentageProps = {
    tf: string;
    symbol: string;
    timeFrameOptions: SelectOption[];
    tickerOptions: SelectOption[];
    type: PriceChangeTypes;
};

export type ScatterProps = {
    timeFrameOptions: SelectOption[];
    xAxis: string;
    yAxis: string;
    tf: string;
};

export type ZScoreHistoryProps = {
    timeFrameOptions: SelectOption[];
    tf: string;
    type: string;
};
