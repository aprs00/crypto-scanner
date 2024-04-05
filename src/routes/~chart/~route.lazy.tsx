import {createLazyFileRoute} from '@tanstack/react-router';
import {useState} from 'react';
import type {Layout} from 'react-grid-layout';
import {Responsive, WidthProvider} from 'react-grid-layout';

import TradingViewRealTimeChart from '@/components/TradingViewWidgets/RealTimeChart';

import {useExchangeInfo} from './api';
import Table from './components/OrderBook';
import Tape from './components/Tape';

const ResponsiveGridLayout = WidthProvider(Responsive) as any;

const gridLayoutRowHeight = 30;

export const Route = createLazyFileRoute('/chart')({
    component: Chart,
});

function Chart() {
    const exchangeInfo = useExchangeInfo();

    const [symbol] = useState('BTCUSDT');
    const [tableHeight, setTableHeight] = useState(() => gridLayoutRowHeight * 13);

    const symbolInfo = exchangeInfo?.data?.symbols.find((s) => s.symbol === symbol);
    const symbolTickSize = Number(symbolInfo?.filters[0].tickSize);

    return (
        <>
            <ResponsiveGridLayout
                cols={{lg: 12, md: 12, sm: 6, xs: 4, xxs: 2}}
                draggableHandle="#drag-handle"
                rowHeight={gridLayoutRowHeight}
                onResize={(grids: Layout[]) => {
                    grids.forEach((grid) => {
                        if (grid.i === 'table') setTableHeight(grid.h * gridLayoutRowHeight);
                    });
                }}
            >
                <div
                    className="bg-slate-900 overflow-hidden"
                    data-grid={{h: 15, w: 12, x: 0, y: 0}}
                    key="tradingViewWidget"
                >
                    <TradingViewRealTimeChart symbol="BINANCE:BTCUSDT" theme="dark" autosize />
                </div>
                <div className="bg-slate-900 overflow-hidden" data-grid={{h: 14, w: 8, x: 0, y: 16}} key="table">
                    <Table symbol={symbol} symbolTickSize={symbolTickSize} tableHeight={tableHeight} />
                </div>
                <div className="bg-slate-900 overflow-hidden" data-grid={{h: 14, w: 4, x: 8, y: 16}} key="tape">
                    <Tape />
                </div>
            </ResponsiveGridLayout>
        </>
    );
}
