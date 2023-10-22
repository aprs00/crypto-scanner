export type HeatmapResponseType = {
    coinId: string;
    coinImageUrl: string;
    coinName: string;
    colorValue: number;
    name: string;
    price: number;
    value: number;
};

export type ColumnDefType = {
    [key: string]: string;
};

export type FiltersPropsType = {
    dataTypes: {
        label: string;
        value: string;
    }[];
    aggregationOptions: string[];
    timeFrameOptions: string[];
    formattedAggregationOptions: Record<string, string>;
    isAggregationSelected(label: string): boolean;
    toggleSwitch: (label: string) => void;
};
