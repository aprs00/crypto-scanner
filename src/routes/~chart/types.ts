export type TapeStateType = {
    price: string;
    size: string;
    time: number;
    market: boolean;
    aggregateTradeId: number;
};

// A maintained local book with numeric [price, quantity] levels, bids sorted
// high->low and asks low->high. This is what the order-book stream emits to
// consumers (parsed once on ingest rather than re-parsed at every call site).
export type OrderBookLevel = [number, number];

export type LocalOrderBook = {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
};

// Which tick-chart sub-series are shown. The main price band is always on; these
// four can be independently toggled (and a disabled one is removed entirely).
export type SeriesVisibility = { spread: boolean; volume: boolean; liquidity: boolean; book: boolean };

export const Orientation = {
    V: 'V',
    H: 'H',
} as const;

export type Orientation = (typeof Orientation)[keyof typeof Orientation];

export const OrderbookType = {
    Asks: 'asks',
    Bids: 'bids',
} as const;

export type OrderbookType = (typeof OrderbookType)[keyof typeof OrderbookType];

export const PanelType = {
    TradingView: 'tradingView',
    OrderBook: 'orderbook',
    Depth: 'depth',
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
    [PanelType.Tape]: 'Tape',
    [PanelType.Tick]: 'Tick Chart',
};

export const PanelTypeDescriptions: Record<PanelType, string> = {
    [PanelType.TradingView]: 'TradingView candlestick chart',
    [PanelType.OrderBook]: 'Live bid/ask ladder grouped by tick size',
    [PanelType.Depth]: 'Cumulative bid/ask depth around mid price',
    [PanelType.Tape]: 'Live trade tape with side coloring',
    [PanelType.Tick]: 'Live bid/ask step chart with spread & trade volume',
};
