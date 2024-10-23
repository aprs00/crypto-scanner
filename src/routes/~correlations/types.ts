import type {SelectOption} from '@/types/api';

export type PearsonHeatmapProps = {
    tf: string;
    type: string;
    timeFrameOptions: SelectOption[];
    typeOptions: SelectOption[];
};
