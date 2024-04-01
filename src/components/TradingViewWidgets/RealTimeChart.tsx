import React, {memo} from 'react';

import Copyright from './Copyright';
import type {AdvancedRealTimeChartProps} from './types';
import Widget from './Widget';

const AdvancedRealTimeChart: React.FC<AdvancedRealTimeChartProps> = ({
    allow_symbol_change = true,
    autosize = false,
    calendar = false,
    container_id = `tradingview_${crypto.randomUUID()}`,
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

    ...props
}) => {
    return (
        <div id="tradingview_widget_wrapper">
            <Widget
                containerId={container_id}
                scriptHTML={{
                    ...(!autosize ? {width} : {width: '100%'}),
                    ...(!autosize ? {height} : {height: '100%'}),
                    autosize,
                    symbol,
                    ...(!range ? {interval} : {range}),
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
                    container_id,
                    disabled_features,
                    enabled_features,
                    studies,
                    watchlist,
                    ...props,
                }}
                scriptSRC="https://s3.tradingview.com/tv.js"
                type="Widget"
            ></Widget>
            <Copyright
                copyrightStyles={copyrightStyles}
                href={`https://www.tradingview.com/symbols/${symbol}`}
                spanText={`${symbol} Chart`}
            />
        </div>
    );
};

export default memo(AdvancedRealTimeChart);
