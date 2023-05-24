import {useState} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';

import Table from '../components/Table';
import Tape from '../components/Tape';
import {useExchangeInfo} from '../api';
import TradingViewRealTimeChart from '@/components/TradingViewWidgets/RealTimeChart';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

const gridLayoutRowHeight = 30;
const gridLayoutTableHeight = 10;
const tradingViewLayout = {x: 0, y: 0, w: 12, h: 16};
const tableLayout = {x: 0, y: 12, w: 8, h: 13};
const tapeLayout = {x: 8, y: 12, w: 4, h: 13};

const OrderBook = () => {
    const exchangeInfo = useExchangeInfo();

    const [symbol, setSymbol] = useState('BTCUSDT');
    const symbolInfo = exchangeInfo?.data?.symbols.find((s) => s.symbol === symbol);
    const [tableHeight, setTableHeight] = useState(() => gridLayoutRowHeight * gridLayoutTableHeight);

    return (
        <>
            <ResponsiveReactGridLayout
                cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}
                rowHeight={gridLayoutRowHeight}
                onResize={(grids) => {
                    grids.forEach((grid) => {
                        if (grid.i === 'table') setTableHeight(grid.h * gridLayoutRowHeight);
                    });
                }}
            >
                <div key="tradingViewWidget" data-grid={tradingViewLayout} className="bg-slate-900 overflow-hidden">
                    <TradingViewRealTimeChart theme="dark" autosize symbol="BINANCE:BTCUSDT" />
                </div>
                <div key="table" data-grid={tableLayout} className="bg-slate-900 overflow-hidden">
                    <Table tableHeight={tableHeight} symbol={symbol} symbolInfo={symbolInfo} />
                </div>
                <div key="tape" data-grid={tapeLayout} className="bg-slate-900 overflow-hidden">
                    <Tape />
                </div>
            </ResponsiveReactGridLayout>
        </>
    );
};

export default OrderBook;
