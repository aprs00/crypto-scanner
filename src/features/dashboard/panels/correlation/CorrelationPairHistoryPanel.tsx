import type { DashboardPanelProps } from '../../model/panelTypes';

import { HoursOptionCategory } from '../shared/data/types';
import { DataType } from '../shared/settings/config';
import { useAnalyticsPanelContext } from '../shared/settings/useAnalyticsPanelContext';
import CorrelationPairHistory from './CorrelationPairHistory';

const CorrelationPairHistoryPanel = (props: DashboardPanelProps) => {
    const { chartDefaults, commonProps, dataTypes, exchangeConfig, hoursOptions, symbols } =
        useAnalyticsPanelContext(props);

    return (
        <CorrelationPairHistory
            {...commonProps}
            baseSymbol={exchangeConfig.baseSymbol || chartDefaults?.correlation_pair_history.base_symbol || ''}
            comparisonSymbols={
                exchangeConfig.comparisonSymbols || chartDefaults?.correlation_pair_history.comparison_symbols || []
            }
            dataType={exchangeConfig.dataType || DataType.Price}
            defaultComparisonSymbols={chartDefaults?.correlation_pair_history.comparison_symbols}
            hours={exchangeConfig.hours || '1'}
            hoursOptions={hoursOptions[HoursOptionCategory.CorrelationPair] || {}}
            symbolOptions={symbols}
            typeOptions={dataTypes}
        />
    );
};

export default CorrelationPairHistoryPanel;
