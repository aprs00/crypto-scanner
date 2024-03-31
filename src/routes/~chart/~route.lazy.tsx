import {createLazyFileRoute} from '@tanstack/react-router';
import {useState} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';

import TradingViewRealTimeChart from '@/components/TradingViewWidgets/RealTimeChart';

import {useExchangeInfo} from './api';
import Table from './components/OrderBook';
import Tape from './components/Tape';

const ResponsiveGridLayout = WidthProvider(Responsive);

const gridLayoutRowHeight = 30;

export const Route = createLazyFileRoute('/chart')({
    component: Chart,
});

function Chart() {
    const exchangeInfo = useExchangeInfo();

    const [symbol, setSymbol] = useState('BTCUSDT');
    const [tableHeight, setTableHeight] = useState(() => gridLayoutRowHeight * 13);
    const [layouts, setLayouts] = useState<any>();

    const symbolInfo = exchangeInfo?.data?.symbols.find((s) => s.symbol === symbol);
    const symbolTickSize = Number(symbolInfo?.filters[0].tickSize);

    return (
        <>
            <ResponsiveGridLayout
                cols={{lg: 12, md: 12, sm: 6, xs: 4, xxs: 2}}
                rowHeight={gridLayoutRowHeight}
                draggableHandle="#drag-handle"
                onLayoutChange={(_, layouts) => setLayouts(layouts)}
                layouts={layouts}
                onResize={(grids) => {
                    grids.forEach((grid) => {
                        if (grid.i === 'table') setTableHeight(grid.h * gridLayoutRowHeight);
                    });
                }}
            >
                <div
                    key="tradingViewWidget"
                    data-grid={{x: 0, y: 0, w: 12, h: 15}}
                    className="bg-slate-900 overflow-hidden"
                >
                    <TradingViewRealTimeChart theme="dark" autosize symbol="BINANCE:BTCUSDT" />
                </div>
                <div key="table" data-grid={{x: 0, y: 16, w: 8, h: 14}} className="bg-slate-900 overflow-hidden">
                    <Table tableHeight={tableHeight} symbol={symbol} symbolTickSize={symbolTickSize} />
                </div>
                <div key="tape" data-grid={{x: 8, y: 16, w: 4, h: 14}} className="bg-slate-900 overflow-hidden">
                    <Tape />
                </div>
            </ResponsiveGridLayout>
        </>
    );
}
