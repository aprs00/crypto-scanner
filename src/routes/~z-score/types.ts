import {SelectOption} from '@/routes/~index/types';

export type ZScoreMatrixResponse = {
    type: string;
    name: string;
    data: [number, number][];
    color: string;
    symbolSize: number;
};

export type ScatterProps = {
    timeFrameOptions: SelectOption[];
    xAxis: string;
    yAxis: string;
    tf: string;
};
