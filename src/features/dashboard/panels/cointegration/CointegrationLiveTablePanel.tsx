import type { DashboardPanelProps } from '../../model/panelTypes';

import { useAnalyticsPanelContext } from '../shared/settings/useAnalyticsPanelContext';
import CointegrationLiveTable from './CointegrationLiveTable';

const CointegrationLiveTablePanel = (props: DashboardPanelProps) => {
    const { chartDefaults, cointegrationConfig, commonProps, exchangeConfig, symbols } =
        useAnalyticsPanelContext(props);

    return (
        <CointegrationLiveTable
            {...commonProps}
            config={cointegrationConfig}
            defaultSymbols={chartDefaults?.cointegration_live_table.symbols}
            limit={exchangeConfig.limit}
            sort={exchangeConfig.sort}
            sortDirection={exchangeConfig.sortDirection}
            symbolOptions={symbols}
            symbols={exchangeConfig.symbols ?? chartDefaults?.cointegration_live_table.symbols ?? []}
            window={exchangeConfig.window}
        />
    );
};

export default CointegrationLiveTablePanel;
