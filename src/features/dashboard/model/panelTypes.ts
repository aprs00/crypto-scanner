import type { Layout } from 'react-grid-layout';

import type { ExchangeChartConfig } from '../panels/shared/settings/config';

export const DashboardPanelType = {
    BetaHeatmap: 'betaHeatmap',
    Scatter: 'scatter',
    Scatter3D: 'scatter3D',
    ZScoreHeatmap: 'zScoreHeatmap',
    PriceChangePercentageDay: 'priceChangePercentageDay',
    PriceChangePercentageHour: 'priceChangePercentageHour',
    CorrelationPairHistory: 'correlationPairHistory',
    CointegrationPairHistory: 'cointegrationPairHistory',
    CointegrationLiveTable: 'cointegrationLiveTable',
    TradingView: 'tradingView',
    OrderBook: 'orderbook',
    Depth: 'depth',
    DepthAndSales: 'depthAndSales',
    Tape: 'tape',
    Tick: 'tick',
    Treemap: 'treemap',
} as const;

export type DashboardPanelType = (typeof DashboardPanelType)[keyof typeof DashboardPanelType];

export interface DashboardPanelItem {
    id: string;
    type: DashboardPanelType;
}

export interface DashboardPanelLayout {
    layout?: Layout;
    exchange?: string;
    exchangeConfigs?: Partial<Record<string, ExchangeChartConfig>>;
}

export interface DashboardGroup {
    id: string;
    name: string;
    panelIds: string[];
}

export type DashboardPanelProps = {
    onRemove: () => void;
    panel: DashboardPanelItem;
    savedLayout: DashboardPanelLayout;
    title: string;
};

export const DEFAULT_GROUP_ID = 'default';
