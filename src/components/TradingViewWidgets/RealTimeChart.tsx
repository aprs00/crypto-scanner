import React, {memo} from 'react';

import type {AdvancedRealTimeChartProps} from './types';
import Copyright from './Copyright';
import Widget from './Widget';

const AdvancedRealTimeChart: React.FC<AdvancedRealTimeChartProps> = ({
    width = 980,
    height = 610,
    autosize = false,
    symbol = 'NASDAQ:AAPL',
    interval = '1',
    range = undefined,
    timezone = 'UTC',
    theme = 'light',
    style = '1',
    locale = 'en',
    toolbar_bg = '#f1f3f6',
    enable_publishing = false,
    hide_top_toolbar = false,
    hide_legend = false,
    withdateranges = true,
    hide_side_toolbar = false,
    allow_symbol_change = true,
    save_image = true,
    details = false,
    hotlist = false,
    calendar = false,
    show_popup_button = false,
    popup_width = '600',
    popup_height = '400',
    watchlist = undefined,
    studies = undefined,
    disabled_features = undefined,
    enabled_features = undefined,
    container_id = `tradingview_${crypto.randomUUID()}`,

    copyrightStyles,

    ...props
}) => {
    return (
        <div id="tradingview_widget_wrapper">
            <Widget
                scriptHTML={{
                    ...(!autosize ? {width} : {width: '100%'}),
                    ...(!autosize ? {height} : {height: '100%'}),
                    autosize,
                    symbol,
                    ...(!range ? {interval} : {range}),
                    timezone,
                    theme,
                    style,
                    locale,
                    toolbar_bg,
                    enable_publishing,
                    hide_top_toolbar,
                    hide_legend,
                    withdateranges,
                    hide_side_toolbar,
                    allow_symbol_change,
                    save_image,
                    details,
                    hotlist,
                    calendar,
                    ...(show_popup_button && {
                        show_popup_button,
                        popup_width,
                        popup_height,
                    }),
                    watchlist,
                    studies,
                    disabled_features,
                    enabled_features,
                    container_id,
                    ...props,
                }}
                scriptSRC="https://s3.tradingview.com/tv.js"
                containerId={container_id}
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
