export const HeatmapType = {
    Grid: 'grid',
    Correlation: 'correlation',
} as const;

export type HeatmapType = (typeof HeatmapType)[keyof typeof HeatmapType];

interface BaseHeatmapResponse {
    data: number[];
}

export interface CorrelationHeatmapResponse extends BaseHeatmapResponse {
    type: typeof HeatmapType.Correlation;
    axis: string[];
}

export interface GridHeatmapResponse extends BaseHeatmapResponse {
    type: typeof HeatmapType.Grid;
    x_axis: string[];
    y_axis: string[];
}

export type HeatmapResponse = CorrelationHeatmapResponse | GridHeatmapResponse;

export type ZScoreScatterResponse = {
    symbol: string;
    data: [number, number];
};
