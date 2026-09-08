import type { DashboardPanelProps } from '../../../model/panelTypes';
import type { ExchangeChartConfig } from './config';

import { useDashboardPanelActions } from '../../../model/panelActionsContext';
import { useBootstrap } from '../data/api';

const DEFAULT_EXCHANGE = 'hyperliquid';

export const useAnalyticsPanelContext = ({ onRemove, panel, savedLayout, title }: DashboardPanelProps) => {
    const exchange = savedLayout.exchange || DEFAULT_EXCHANGE;
    const exchangeConfig = savedLayout.exchangeConfigs?.[exchange] || {};
    const bootstrap = useBootstrap();
    const exchangeData = bootstrap.data?.exchange_data?.[exchange];
    const { setChartExchange, updateExchangeConfig } = useDashboardPanelActions();

    const handleExchangeChange = (nextExchange: string) => setChartExchange(panel.id, nextExchange);
    const handleConfigChange = (config: ExchangeChartConfig) => updateExchangeConfig(panel.id, exchange, config);

    return {
        chartDefaults: exchangeData?.chart_defaults,
        cointegrationConfig: bootstrap.data?.cointegration_live_table,
        commonProps: {
            exchange,
            exchanges: bootstrap.data?.exchanges || [],
            onConfigChange: handleConfigChange,
            onExchangeChange: handleExchangeChange,
            onRemoveClick: onRemove,
            title,
        },
        dataTypes: exchangeData?.data_types || [],
        exchangeConfig,
        hoursOptions: exchangeData?.hours_options || {},
        symbols: exchangeData?.symbols || [],
    };
};
