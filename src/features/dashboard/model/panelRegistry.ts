import type { ComponentType } from 'react';
import type { Layout } from 'react-grid-layout';

import type {
    DashboardPanelItem,
    DashboardPanelLayout,
    DashboardPanelProps,
    DashboardPanelType as PanelType,
} from './panelTypes';

import { DashboardPanelType } from './panelTypes';

type DashboardPanelModule = {
    default: ComponentType<DashboardPanelProps>;
};

export type DashboardPanelDefinition = {
    catalogOrder: number;
    cleanup?: (panelId: string) => Promise<void>;
    defaultHeight: number;
    defaultOrder?: number;
    label: string;
    load: () => Promise<DashboardPanelModule>;
    type: PanelType;
};

const dashboardPanelRegistry = {
    [DashboardPanelType.Footprint]: {
        catalogOrder: 0,
        cleanup: async (panelId) =>
            (await import('../panels/footprint/cleanupFootprintPanelState')).cleanupFootprintPanelState(panelId),
        defaultHeight: 20,
        defaultOrder: 0,
        label: 'Footprint (Beta)',
        load: () => import('../panels/footprint/FootprintChart'),
        type: DashboardPanelType.Footprint,
    },
    [DashboardPanelType.DepthAndSales]: {
        catalogOrder: 1,
        cleanup: async (panelId) =>
            (await import('../panels/shared/settings/cleanupMarketPanelState')).cleanupMarketPanelState(panelId),
        defaultHeight: 20,
        defaultOrder: 6,
        label: 'DOM Ladder',
        load: () => import('../panels/dom/DepthAndSales'),
        type: DashboardPanelType.DepthAndSales,
    },
    [DashboardPanelType.BetaHeatmap]: {
        catalogOrder: 2,
        defaultHeight: 25,
        defaultOrder: 1,
        label: 'Pearson Correlation',
        load: () => import('../panels/correlation/BetaHeatmapPanel'),
        type: DashboardPanelType.BetaHeatmap,
    },
    [DashboardPanelType.ZScoreHeatmap]: {
        catalogOrder: 3,
        defaultHeight: 25,
        defaultOrder: 5,
        label: 'Z·Score Heatmap',
        load: () => import('../panels/z-score/ZScoreHeatmapPanel'),
        type: DashboardPanelType.ZScoreHeatmap,
    },
    [DashboardPanelType.Scatter]: {
        catalogOrder: 4,
        defaultHeight: 25,
        defaultOrder: 8,
        label: 'Z·Score Scatter',
        load: () => import('../panels/z-score/ScatterPanel'),
        type: DashboardPanelType.Scatter,
    },
    [DashboardPanelType.Scatter3D]: {
        catalogOrder: 5,
        defaultHeight: 20,
        defaultOrder: 4,
        label: 'Z·Score 3D',
        load: () => import('../panels/z-score/Scatter3DPanel'),
        type: DashboardPanelType.Scatter3D,
    },
    [DashboardPanelType.PriceChangePercentageDay]: {
        catalogOrder: 6,
        defaultHeight: 25,
        defaultOrder: 9,
        label: 'Price Change · Day of Week',
        load: () => import('../panels/price-change/PriceChangeDayPanel'),
        type: DashboardPanelType.PriceChangePercentageDay,
    },
    [DashboardPanelType.PriceChangePercentageHour]: {
        catalogOrder: 7,
        defaultHeight: 20,
        defaultOrder: 7,
        label: 'Price Change · Hour of Day (UTC)',
        load: () => import('../panels/price-change/PriceChangeHourPanel'),
        type: DashboardPanelType.PriceChangePercentageHour,
    },
    [DashboardPanelType.CorrelationPairHistory]: {
        catalogOrder: 8,
        defaultHeight: 12,
        defaultOrder: 2,
        label: 'Correlation Pair History',
        load: () => import('../panels/correlation/CorrelationPairHistoryPanel'),
        type: DashboardPanelType.CorrelationPairHistory,
    },
    [DashboardPanelType.CointegrationPairHistory]: {
        catalogOrder: 9,
        defaultHeight: 14,
        defaultOrder: 10,
        label: 'Cointegration Pair History',
        load: () => import('../panels/cointegration/CointegrationPairHistoryPanel'),
        type: DashboardPanelType.CointegrationPairHistory,
    },
    [DashboardPanelType.CointegrationLiveTable]: {
        catalogOrder: 10,
        defaultHeight: 20,
        defaultOrder: 11,
        label: 'Cointegration',
        load: () => import('../panels/cointegration/CointegrationLiveTablePanel'),
        type: DashboardPanelType.CointegrationLiveTable,
    },
    [DashboardPanelType.TradingView]: {
        catalogOrder: 11,
        cleanup: async (panelId) =>
            (await import('../panels/shared/settings/cleanupMarketPanelState')).cleanupMarketPanelState(panelId),
        defaultHeight: 15,
        defaultOrder: 12,
        label: 'Chart',
        load: () => import('../panels/trading-view/TradingViewPanel'),
        type: DashboardPanelType.TradingView,
    },
    [DashboardPanelType.OrderBook]: {
        catalogOrder: 12,
        cleanup: async (panelId) =>
            (await import('../panels/shared/settings/cleanupMarketPanelState')).cleanupMarketPanelState(panelId),
        defaultHeight: 14,
        defaultOrder: 13,
        label: 'Order Book',
        load: () => import('../panels/order-book/OrderBook'),
        type: DashboardPanelType.OrderBook,
    },
    [DashboardPanelType.Depth]: {
        catalogOrder: 13,
        cleanup: async (panelId) =>
            (await import('../panels/shared/settings/cleanupMarketPanelState')).cleanupMarketPanelState(panelId),
        defaultHeight: 14,
        defaultOrder: 14,
        label: 'Depth Chart',
        load: () => import('../panels/depth/DepthChart'),
        type: DashboardPanelType.Depth,
    },
    [DashboardPanelType.Tape]: {
        catalogOrder: 14,
        cleanup: async (panelId) =>
            (await import('../panels/shared/settings/cleanupMarketPanelState')).cleanupMarketPanelState(panelId),
        defaultHeight: 14,
        defaultOrder: 15,
        label: 'Tape',
        load: () => import('../panels/tape/ChartTape'),
        type: DashboardPanelType.Tape,
    },
    [DashboardPanelType.Tick]: {
        catalogOrder: 15,
        cleanup: async (panelId) =>
            (await import('../panels/shared/settings/cleanupMarketPanelState')).cleanupMarketPanelState(panelId),
        defaultHeight: 16,
        defaultOrder: 3,
        label: 'Tick Chart',
        load: () => import('../panels/tick/TickChart'),
        type: DashboardPanelType.Tick,
    },
    [DashboardPanelType.Treemap]: {
        catalogOrder: 16,
        defaultHeight: 20,
        defaultOrder: 16,
        label: 'Market Treemap',
        load: () => import('../panels/treemap/TreemapPanel'),
        type: DashboardPanelType.Treemap,
    },
} satisfies Record<PanelType, DashboardPanelDefinition>;

const panelDefinitions = Object.values(dashboardPanelRegistry) as DashboardPanelDefinition[];
const hasDefaultOrder = (
    definition: DashboardPanelDefinition,
): definition is DashboardPanelDefinition & { defaultOrder: number } => definition.defaultOrder !== undefined;

export const dashboardPanelCatalog = [...panelDefinitions].sort(
    (left, right) => left.catalogOrder - right.catalogOrder,
);

export const defaultDashboardPanelTypes = panelDefinitions
    .filter(hasDefaultOrder)
    .sort((left, right) => left.defaultOrder - right.defaultOrder)
    .map((definition) => definition.type);

export const panelDefinitionFor = (type: PanelType): DashboardPanelDefinition =>
    dashboardPanelRegistry[type] as DashboardPanelDefinition;

export const layoutForPanel = (type: PanelType, id: string, y: number): Layout => ({
    h: panelDefinitionFor(type).defaultHeight,
    i: id,
    w: 12,
    x: 0,
    y,
});

type InitialDashboardPanels = {
    panels: DashboardPanelItem[];
    savedGridLayouts: Record<string, DashboardPanelLayout>;
};

export const createDefaultDashboardPanels = (
    createId: () => string = () => crypto.randomUUID(),
): InitialDashboardPanels => {
    let y = 0;
    const panels: DashboardPanelItem[] = [];
    const savedGridLayouts: Record<string, DashboardPanelLayout> = {};

    for (const type of defaultDashboardPanelTypes) {
        const id = createId();
        const layout = layoutForPanel(type, id, y);
        panels.push({ id, type });
        savedGridLayouts[id] = { layout };
        y += layout.h;
    }

    return { panels, savedGridLayouts };
};

export const cleanupPanel = async (type: PanelType, panelId: string): Promise<void> => {
    try {
        await panelDefinitionFor(type).cleanup?.(panelId);
    } catch (error) {
        console.error(`Unable to clear persisted state for dashboard panel ${panelId}.`, error);
    }
};
