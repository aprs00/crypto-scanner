import type { DashboardPanelProps } from '../../model/panelTypes';

import { HoursOptionCategory } from '../shared/data/types';
import { TimePeriodType } from '../shared/settings/config';
import { useAnalyticsPanelContext } from '../shared/settings/useAnalyticsPanelContext';
import PriceChangePercentage from './PriceChangePercentage';

const PriceChangeDayPanel = (props: DashboardPanelProps) => {
    const { chartDefaults, commonProps, exchangeConfig, hoursOptions, symbols } = useAnalyticsPanelContext(props);

    return (
        <PriceChangePercentage
            {...commonProps}
            hours={exchangeConfig.hours || '168'}
            periodType={TimePeriodType.Day}
            symbol={exchangeConfig.symbol || chartDefaults?.price_change_percentage.symbol || ''}
            symbolOptions={symbols}
            timeFrameOptions={hoursOptions[HoursOptionCategory.AveragePrice] || {}}
        />
    );
};

export default PriceChangeDayPanel;
