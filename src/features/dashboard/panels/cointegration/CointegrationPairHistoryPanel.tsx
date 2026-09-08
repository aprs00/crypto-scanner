import type { DashboardPanelProps } from '../../model/panelTypes';

import { HoursOptionCategory } from '../shared/data/types';
import { useAnalyticsPanelContext } from '../shared/settings/useAnalyticsPanelContext';
import CointegrationPairHistory from './CointegrationPairHistory';

const CointegrationPairHistoryPanel = (props: DashboardPanelProps) => {
    const { chartDefaults, cointegrationConfig, commonProps, exchangeConfig, hoursOptions, symbols } =
        useAnalyticsPanelContext(props);

    return (
        <CointegrationPairHistory
            {...commonProps}
            baseSymbol={exchangeConfig.baseSymbol || chartDefaults?.cointegration_pair_history.base_symbol || ''}
            comparisonSymbols={
                exchangeConfig.comparisonSymbols || chartDefaults?.cointegration_pair_history.comparison_symbols || []
            }
            defaultComparisonSymbols={chartDefaults?.cointegration_pair_history.comparison_symbols}
            hours={exchangeConfig.hours || '4'}
            hoursOptions={hoursOptions[HoursOptionCategory.CointegrationPair] || {}}
            metric={exchangeConfig.cointegrationMetric}
            symbolOptions={symbols}
            window={exchangeConfig.window || chartDefaults?.cointegration_pair_history.window || ''}
            windowOptions={cointegrationConfig?.window_options || {}}
        />
    );
};

export default CointegrationPairHistoryPanel;
