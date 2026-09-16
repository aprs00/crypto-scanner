import { describe, expect, it } from 'vitest';

import {
    createDefaultDashboardPanels,
    dashboardPanelCatalog,
    defaultDashboardPanelTypes,
    panelDefinitionFor,
} from './panelRegistry';
import { DashboardPanelType } from './panelTypes';

describe('dashboard panel catalog', () => {
    it('contains every panel type exactly once', () => {
        const catalogTypes = dashboardPanelCatalog.map((definition) => definition.type);

        expect(catalogTypes).toHaveLength(17);
        expect(new Set(catalogTypes).size).toBe(17);
        expect(new Set(catalogTypes)).toEqual(new Set(Object.values(DashboardPanelType)));
    });

    it('includes every available panel in the defaults while preserving the original order', () => {
        const catalogTypes = new Set(dashboardPanelCatalog.map((definition) => definition.type));

        expect(defaultDashboardPanelTypes).toEqual([
            DashboardPanelType.BetaHeatmap,
            DashboardPanelType.CorrelationPairHistory,
            DashboardPanelType.Tick,
            DashboardPanelType.Scatter3D,
            DashboardPanelType.ZScoreHeatmap,
            DashboardPanelType.DepthAndSales,
            DashboardPanelType.PriceChangePercentageHour,
            DashboardPanelType.Scatter,
            DashboardPanelType.PriceChangePercentageDay,
            DashboardPanelType.CointegrationPairHistory,
            DashboardPanelType.CointegrationLiveTable,
            DashboardPanelType.TradingView,
            DashboardPanelType.OrderBook,
            DashboardPanelType.Depth,
            DashboardPanelType.Tape,
            DashboardPanelType.Treemap,
        ]);
        expect(new Set(defaultDashboardPanelTypes).size).toBe(defaultDashboardPanelTypes.length);
        expect(defaultDashboardPanelTypes.every((type) => catalogTypes.has(type))).toBe(true);
        expect(new Set(defaultDashboardPanelTypes)).toEqual(catalogTypes);
        expect(catalogTypes.size).toBe(17);
    });

    it('creates full-width, ordered, non-overlapping defaults', () => {
        let nextId = 0;
        const dashboard = createDefaultDashboardPanels(() => `panel-${nextId++}`);
        let expectedY = 0;

        expect(dashboard.panels.map((panel) => panel.type)).toEqual(defaultDashboardPanelTypes);
        for (const panel of dashboard.panels) {
            const layout = dashboard.savedGridLayouts[panel.id]?.layout;
            expect(layout).toMatchObject({ i: panel.id, w: 12, x: 0, y: expectedY });
            expectedY += panelDefinitionFor(panel.type).defaultHeight;
        }
        expect(Object.keys(dashboard.savedGridLayouts)).toHaveLength(defaultDashboardPanelTypes.length);
        expect(dashboard.savedGridLayouts['panel-7']?.layout?.h).toBe(20);
    });
});
