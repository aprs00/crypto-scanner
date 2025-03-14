import type {Layout} from 'react-grid-layout';

import TradingViewRealTimeChart from '@/components/TradingViewWidgets/RealTimeChart';
import {useState} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';

import {useExchangeInfo} from './api';
import ChartTape from './components/ChartTape';
import Table from './components/OrderBook';

const ResponsiveGridLayout = WidthProvider(Responsive);

const gridLayoutRowHeight = 30;

const CSChart = () => {
    const exchangeInfo = useExchangeInfo();

    const [symbol] = useState('BTCUSDT');
    const [tableHeight, setTableHeight] = useState(() => gridLayoutRowHeight * 13);

    const symbolInfo = exchangeInfo.data?.symbols.find((s) => s.symbol === symbol);
    const symbolTickSize = Number(symbolInfo?.filters[0].tickSize);

    return (
        <ResponsiveGridLayout
            cols={{lg: 12, md: 12, sm: 6, xs: 4, xxs: 2}}
            draggableHandle="#drag-handle"
            onResize={(grids: Layout[]) => {
                grids.forEach((grid) => {
                    if (grid.i === 'table') setTableHeight(grid.h * gridLayoutRowHeight);
                });
            }}
            rowHeight={gridLayoutRowHeight}
        >
            <div
                className="bg-slate-900 overflow-hidden"
                data-grid={{h: 15, w: 12, x: 0, y: 0}}
                key="tradingViewWidget"
            >
                <TradingViewRealTimeChart autosize symbol="BINANCE:BTCUSDT" theme="dark" />
            </div>
            <div className="bg-slate-900 overflow-hidden" data-grid={{h: 14, w: 8, x: 0, y: 16}} key="table">
                <Table symbol={symbol} symbolTickSize={symbolTickSize} tableHeight={tableHeight} />
            </div>
            <div className="bg-slate-900 overflow-hidden" data-grid={{h: 14, w: 4, x: 8, y: 16}} key="tape">
                <ChartTape />
            </div>
        </ResponsiveGridLayout>
    );
};

export default CSChart;
