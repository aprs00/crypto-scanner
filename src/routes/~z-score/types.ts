import {SelectOptionType} from '@/routes/~index/types';

//
// RESPONSE TYPES
//
export type ZScoreMatrixResponseType = {
    type: string;
    name: string;
    data: [string, string][];
    color: string;
    symbolSize: number;
};

//
// PROP TYPES
//
export type ScatterPropsType = {
    timeFrameOptions: SelectOptionType[];
    xAxis: string;
    yAxis: string;
    tf: string;
};
