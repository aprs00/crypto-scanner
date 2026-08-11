import React, { useId } from 'react';

import type { AdvancedRealTimeChartProps } from './types';

import Copyright from './Copyright';
import Widget from './Widget';

const AdvancedRealTimeChart: React.FC<AdvancedRealTimeChartProps> = ({
    allow_symbol_change = true,
    autosize = false,
    calendar = false,
    container_id,
    copyrightStyles,
    details = false,
    disabled_features = undefined,
    enable_publishing = false,
    enabled_features = undefined,
    height = 610,
    hide_legend = false,
    hide_side_toolbar = false,
    hide_top_toolbar = false,
    hotlist = false,
    interval = '1',
    locale = 'en',
    popup_height = '400',
    popup_width = '600',
    range = undefined,
    save_image = true,
    show_popup_button = false,
    studies = undefined,
    style = '1',
    symbol = 'NASDAQ:AAPL',
    theme = 'light',
    timezone = 'UTC',
    toolbar_bg = '#f1f3f6',
    watchlist = undefined,
    width = 980,
    withdateranges = true,
    backgroundColor,
    gridColor,
    overrides,
    ...props
}) => {
    const reactId = useId();
    const generatedContainerId = `tradingview_${reactId.replace(/:/g, '')}`;
    const containerId = container_id ?? generatedContainerId;

    return (
        <div id="tradingview_widget_wrapper">
            <Widget
                containerId={containerId}
                scriptHTML={{
                    ...(!autosize ? { width } : { width: '100%' }),
                    ...(!autosize ? { height } : { height: '100%' }),
                    autosize,
                    symbol,
                    ...(!range ? { interval } : { range }),
                    allow_symbol_change,
                    calendar,
                    details,
                    enable_publishing,
                    hide_legend,
                    hide_side_toolbar,
                    hide_top_toolbar,
                    hotlist,
                    locale,
                    save_image,
                    style,
                    theme,
                    timezone,
                    toolbar_bg,
                    withdateranges,
                    ...(show_popup_button && {
                        popup_height,
                        popup_width,
                        show_popup_button,
                    }),
                    ...(backgroundColor && { backgroundColor }),
                    ...(gridColor && { gridColor }),
                    ...(overrides && { overrides }),
                    container_id: containerId,
                    disabled_features,
                    enabled_features,
                    studies,
                    watchlist,
                    ...props,
                }}
                scriptSRC="https://s3.tradingview.com/tv.js"
                type="Widget"
            />

            <Copyright
                copyrightStyles={copyrightStyles}
                href={`https://www.tradingview.com/symbols/${symbol}`}
                spanText={`${symbol} Chart`}
            />
        </div>
    );
};

export default AdvancedRealTimeChart;
