import type { DashboardPanelProps } from '../../model/panelTypes';

import { HoursOptionCategory } from '../shared/data/types';
import { DataType } from '../shared/settings/config';
import { useAnalyticsPanelContext } from '../shared/settings/useAnalyticsPanelContext';
import ZScoreScatter3D from './ZScoreScatter3D';

const Scatter3DPanel = (props: DashboardPanelProps) => {
    const { chartDefaults, commonProps, dataTypes, exchangeConfig, hoursOptions, symbols } =
        useAnalyticsPanelContext(props);
    const defaultZAxis = dataTypes.includes(DataType.Trades) ? DataType.Trades : DataType.Volume;

    return (
        <ZScoreScatter3D
            {...commonProps}
            defaultSymbols={chartDefaults?.heatmap.symbols}
            hours={exchangeConfig.hours || '4'}
            hoursOptions={hoursOptions[HoursOptionCategory.ZScore] || {}}
            symbolOptions={symbols}
            symbols={exchangeConfig.symbols ?? chartDefaults?.heatmap.symbols ?? []}
            xAxis={exchangeConfig.xAxis || DataType.Price}
            yAxis={exchangeConfig.yAxis || DataType.Volume}
            zAxis={exchangeConfig.zAxis || defaultZAxis}
        />
    );
};

export default Scatter3DPanel;
