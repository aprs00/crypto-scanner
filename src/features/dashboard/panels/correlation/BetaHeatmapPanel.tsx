import type { DashboardPanelProps } from '../../model/panelTypes';

import { HoursOptionCategory } from '../shared/data/types';
import { DataType } from '../shared/settings/config';
import { useAnalyticsPanelContext } from '../shared/settings/useAnalyticsPanelContext';
import BetaHeatmap from './BetaHeatmap';

const BetaHeatmapPanel = (props: DashboardPanelProps) => {
    const { chartDefaults, commonProps, dataTypes, exchangeConfig, hoursOptions, symbols } =
        useAnalyticsPanelContext(props);

    return (
        <BetaHeatmap
            {...commonProps}
            dataType={exchangeConfig.dataType || DataType.Price}
            defaultSymbols={chartDefaults?.heatmap.symbols}
            hours={exchangeConfig.hours || '4'}
            hoursOptions={hoursOptions[HoursOptionCategory.Correlation] || {}}
            symbolOptions={symbols}
            symbols={exchangeConfig.symbols ?? chartDefaults?.heatmap.symbols ?? []}
            typeOptions={dataTypes}
        />
    );
};

export default BetaHeatmapPanel;
