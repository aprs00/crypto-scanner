import type {SelectOption} from '@/types/api';

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
