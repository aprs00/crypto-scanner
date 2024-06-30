export type SelectOption = {
    value: string;
    label: string;
};

export type CorrelationsResponse = {
    data: [[number, number, number]][];
    xAxis: string[];
    yAxis: string[];
};

export type PearsonHeatmapProps = {
    tf: string;
    type: string;
    timeFrameOptions: SelectOption[];
    typeOptions: SelectOption[];
};
