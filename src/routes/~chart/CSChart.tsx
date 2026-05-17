import { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';

import TradingViewRealTimeChart from '@/components/TradingViewWidgets/RealTimeChart';
import { palette } from '@/lib/theme';

import { useExchangeInfo } from './api';
import ChartTape from './components/ChartTape';
import Table from './components/OrderBook';

const ResponsiveGridLayout = WidthProvider(Responsive);

const gridLayoutRowHeight = 30;
const gridLayoutMargin: [number, number] = [8, 8];

const tradingViewThemeProps = {
    backgroundColor: palette.bgPanel,
    gridColor: palette.bd,
    overrides: {
        'paneProperties.background': palette.bgPanel,
        'paneProperties.backgroundType': 'solid',
        'paneProperties.vertGridProperties.color': palette.bd,
        'paneProperties.horzGridProperties.color': palette.bd,
        'scalesProperties.lineColor': palette.bdHi,
        'scalesProperties.textColor': palette.fgDim,
        'mainSeriesProperties.candleStyle.upColor': palette.up,
        'mainSeriesProperties.candleStyle.downColor': palette.down,
        'mainSeriesProperties.candleStyle.borderUpColor': palette.up,
        'mainSeriesProperties.candleStyle.borderDownColor': palette.down,
        'mainSeriesProperties.candleStyle.wickUpColor': palette.up,
        'mainSeriesProperties.candleStyle.wickDownColor': palette.down,
    },
} as const;

const CSChart = () => {
    const exchangeInfo = useExchangeInfo();

    const [symbol] = useState('BTCUSDT');

    const symbolInfo = exchangeInfo.data?.symbols.find((s) => s.symbol === symbol);
    const symbolTickSize = Number(symbolInfo?.filters[0].tickSize);

    return (
        <>
            <div className="grid-host scroll">
                <ResponsiveGridLayout
                    cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
                    draggableHandle="#drag-handle"
                    margin={gridLayoutMargin}
                    rowHeight={gridLayoutRowHeight}
                >
                    <div className="grid-card" data-grid={{ h: 15, w: 12, x: 0, y: 0 }} key="tradingViewWidget">
                        <TradingViewRealTimeChart
                            autosize
                            symbol="BINANCE:BTCUSDT"
                            theme="dark"
                            toolbar_bg={palette.bgAlt}
                            {...tradingViewThemeProps}
                        />
                    </div>
                    <div className="grid-card" data-grid={{ h: 14, w: 8, x: 0, y: 16 }} key="table">
                        <Table symbol={symbol} symbolTickSize={symbolTickSize} />
                    </div>
                    <div className="grid-card" data-grid={{ h: 14, w: 4, x: 8, y: 16 }} key="tape">
                        <ChartTape />
                    </div>
                </ResponsiveGridLayout>
            </div>
        </>
    );
};

export default CSChart;
