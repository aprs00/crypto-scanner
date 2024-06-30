import {SelectOptionType} from '@/routes/~index/types';

export type ZScoreMatrixResponseType = {
    type: string;
    name: string;
    data: [number, number][];
    color: string;
    symbolSize: number;
};

export type ScatterPropsType = {
    timeFrameOptions: SelectOptionType[];
    xAxis: string;
    yAxis: string;
    tf: string;
};
