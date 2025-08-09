export type HeatmapResponse = {
    data: number[];
    axis: string[];
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
