import type { DashboardPanelProps } from '../../model/panelTypes';

import { HoursOptionCategory } from '../shared/data/types';
import { DataType } from '../shared/settings/config';
import { useAnalyticsPanelContext } from '../shared/settings/useAnalyticsPanelContext';
import ZScoreScatter from './ZScoreScatter';

const ScatterPanel = (props: DashboardPanelProps) => {
    const { chartDefaults, commonProps, exchangeConfig, hoursOptions, symbols } = useAnalyticsPanelContext(props);

    return (
        <ZScoreScatter
            {...commonProps}
            defaultSymbols={chartDefaults?.heatmap.symbols}
            hours={exchangeConfig.hours || '4'}
            hoursOptions={hoursOptions[HoursOptionCategory.ZScore] || {}}
            symbolOptions={symbols}
            symbols={exchangeConfig.symbols ?? chartDefaults?.heatmap.symbols ?? []}
            xAxis={exchangeConfig.xAxis || DataType.Price}
            yAxis={exchangeConfig.yAxis || DataType.Volume}
        />
    );
};

export default ScatterPanel;
