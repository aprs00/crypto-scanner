import {useState} from 'react';
import {Responsive, WidthProvider} from 'react-grid-layout';

import Table from '../components/Table';
import Tape from '../components/Tape';
import TradingViewRealTimeChart from '@/components/TradingViewWidgets/RealTimeChart';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

const GRID_LAYOUT_ROW_HEIGHT = 30;
const GRID_LAYOUT_TABLE_HEIGHT = 10;
const tradingViewLayout = {x: 0, y: 0, w: 12, h: 16};
const tableLayout = {x: 0, y: 12, w: 8, h: 13};
const tapeLayout = {x: 8, y: 12, w: 4, h: 13};

const OrderBook = () => {
    // const exchangeInfo = useExchangeInfo();

    const [groupByVal, setGroupByVal] = useState(() => 1);
    const [tableAlignment, setTableAlignment] = useState('V');
    const [tableHeight, setTableHeight] = useState(() => GRID_LAYOUT_TABLE_HEIGHT * GRID_LAYOUT_ROW_HEIGHT);

    return (
        <>
            <ResponsiveReactGridLayout
                cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}
                rowHeight={GRID_LAYOUT_ROW_HEIGHT}
                onResize={(grids) => {
                    grids.forEach((grid) => {
                        if (grid.i === 'table') {
                            setTableHeight(grid.h * GRID_LAYOUT_ROW_HEIGHT);
                        }
                    });
                }}
            >
                <div key="tradingViewWidget" data-grid={tradingViewLayout} className="bg-slate-900 overflow-hidden">
                    <TradingViewRealTimeChart theme="dark" autosize symbol="BINANCE:BTCUSDT" />
                </div>
                <div key="table" data-grid={tableLayout} className="bg-slate-900 overflow-hidden">
                    <Table
                        groupedAsks={[]}
                        groupedBids={[]}
                        tableHeight={tableHeight}
                        setGroupByVal={setGroupByVal}
                        groupByVal={groupByVal}
                        tableAlignment={tableAlignment}
                        setTableAlignment={setTableAlignment}
                    />
                </div>
                <div key="tape" data-grid={tapeLayout} className="bg-slate-900 overflow-hidden">
                    <Tape />
                </div>
            </ResponsiveReactGridLayout>
        </>
    );
};

export default OrderBook;
