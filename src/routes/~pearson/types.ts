export type SelectOption = {
    value: string;
    label: string;
};

//
// RESPONSE TYPES
//
export type PearsonResponse = {
    data: [[number, number, number]][];
    xAxis: string[];
    yAxis: string[];
};

//
// PROP TYPES
//
export type PearsonHeatmapProps = {
    tf: string;
    type: string;
    timeFrameOptions: SelectOption[];
    typeOptions: SelectOption[];
};
