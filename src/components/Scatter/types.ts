import type {ZScoreMatrixResponseType} from '@/routes/~index/types';

export type ScatterPropsType = {
    data: ZScoreMatrixResponseType[];
    xAxis: string;
    yAxis: string;
};
