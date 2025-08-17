interface BaseHeatmapResponse {
    data: number[];
}

export interface CorrelationHeatmapResponse extends BaseHeatmapResponse {
    axis: string[];
}

export interface GridHeatmapResponse extends BaseHeatmapResponse {
    x_axis: string[];
    y_axis: string[];
}

export type HeatmapResponse = CorrelationHeatmapResponse | GridHeatmapResponse;

export const isCorrelationHeatmap = (data: HeatmapResponse): data is CorrelationHeatmapResponse => {
    return 'axis' in data;
};

export const isGridHeatmap = (data: HeatmapResponse): data is GridHeatmapResponse => {
    return 'x_axis' in data && 'y_axis' in data;
};

export type SelectOption = {
    value: string;
    label: string;
};

export type ZScoreMatrixResponse = {
    type: string;
    name: string;
    data: [number, number][];
    color: string;
    symbolSize: number;
};
