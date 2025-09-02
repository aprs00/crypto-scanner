interface BaseHeatmapResponse {
    data: number[];
}

export interface CorrelationHeatmapResponse extends BaseHeatmapResponse {
    type: 'correlation';
    axis: string[];
}

export interface GridHeatmapResponse extends BaseHeatmapResponse {
    type: 'grid';
    x_axis: string[];
    y_axis: string[];
}

export type HeatmapResponse = CorrelationHeatmapResponse | GridHeatmapResponse;

export type ZScoreMatrixResponse = {
    symbol: string;
    data: [number, number];
};
