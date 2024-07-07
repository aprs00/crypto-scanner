import type {ZScoreMatrixResponse} from '@/routes/~index/types';

export type ScatterProps = {
    data: ZScoreMatrixResponse[];
    xAxis: string;
    yAxis: string;
};
