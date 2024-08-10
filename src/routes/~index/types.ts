import type {SelectOption} from '@/types';

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

export type ZScoreHistoryProps = {
    timeFrameOptions: SelectOption[];
    tf: string;
    type: string;
};
