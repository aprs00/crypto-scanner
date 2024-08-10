import {CorrelationsResponse} from '@/routes/~correlations/types';

export type HeatmapProps = {
    data?: CorrelationsResponse;
    tooltipType?: 'duration';
};
