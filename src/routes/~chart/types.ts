export type TapeStateType = {
    price: string;
    size: string;
    time: number;
    market: boolean;
    aggregateTradeId: number;
};

export type { LocalOrderBook, OrderBookLevel } from '@/services/exchanges/types';

// Which tick-chart sub-series are shown. The main price band is always on; these
// four can be independently toggled (and a disabled one is removed entirely).
export type SeriesVisibility = { spread: boolean; volume: boolean; liquidity: boolean; book: boolean };

export const Orientation = {
    V: 'V',
    H: 'H',
} as const;

export type Orientation = (typeof Orientation)[keyof typeof Orientation];

export const PanelType = {
    TradingView: 'tradingView',
    OrderBook: 'orderbook',
    Depth: 'depth',
    DepthAndSales: 'depthAndSales',
    Tape: 'tape',
    Tick: 'tick',
} as const;

export type PanelType = (typeof PanelType)[keyof typeof PanelType];

export interface PanelItem {
    id: string;
    type: PanelType;
}

export const PanelTypeLabels: Record<PanelType, string> = {
    [PanelType.TradingView]: 'Chart',
    [PanelType.OrderBook]: 'Order Book',
    [PanelType.Depth]: 'Depth Chart',
    [PanelType.DepthAndSales]: 'DOM Ladder',
    [PanelType.Tape]: 'Tape',
    [PanelType.Tick]: 'Tick Chart',
};

export const PanelTypeDescriptions: Record<PanelType, string> = {
    [PanelType.TradingView]: 'TradingView candlestick chart',
    [PanelType.OrderBook]: 'Live bid/ask ladder grouped by tick size',
    [PanelType.Depth]: 'Cumulative bid/ask depth around mid price',
    [PanelType.DepthAndSales]: 'Price ladder with depth, executions, tape, and pulled/added liquidity',
    [PanelType.Tape]: 'Live trade tape with side coloring',
    [PanelType.Tick]: 'Live bid/ask step chart with spread & trade volume',
};
