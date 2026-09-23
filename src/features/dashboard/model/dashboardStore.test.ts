import { beforeEach, describe, expect, it } from 'vitest';

import useFootprintSettingsStore from '../panels/footprint/useFootprintSettingsStore';
import useChartSeriesStore from '../panels/shared/settings/useChartSeriesStore';
import useChartSourceStore from '../panels/shared/source/useChartSourceStore';
import useDashboardStore from './dashboardStore';
import { createDefaultDashboardPanels } from './panelRegistry';
import { DashboardPanelType, DEFAULT_GROUP_ID } from './panelTypes';

const resetStores = () => {
    let nextId = 0;
    const dashboard = createDefaultDashboardPanels(() => `default-${nextId++}`);
    useDashboardStore.setState({
        activeGroupId: DEFAULT_GROUP_ID,
        groups: [{ id: DEFAULT_GROUP_ID, name: 'Default', panelIds: dashboard.panels.map((panel) => panel.id) }],
        panels: dashboard.panels,
        savedGridLayouts: dashboard.savedGridLayouts,
    });
    useChartSourceStore.setState({ sources: {} });
    useChartSeriesStore.setState({ dom: {}, liquidity: {}, orderBookNotional: {}, visibility: {} });
    useFootprintSettingsStore.setState({ settings: {} });
};

const attachPanelSettings = (panelId: string) => {
    useChartSourceStore.getState().setSymbol(panelId, 'ETHUSDT', 'ETH');
    useChartSeriesStore.getState().toggleSeries(panelId, 'book');
};

const expectPanelSettingsRemoved = (panelId: string) => {
    expect(useChartSourceStore.getState().sources[panelId]).toBeUndefined();
    expect(useChartSeriesStore.getState().visibility[panelId]).toBeUndefined();
    expect(useFootprintSettingsStore.getState().settings[panelId]).toBeUndefined();
};

describe('dashboard store', () => {
    beforeEach(resetStores);

    it('appends new panels below the active group', () => {
        const before = useDashboardStore.getState();
        const previousBottom = Math.max(
            ...Object.values(before.savedGridLayouts).map((saved) => {
                const layout = saved.layout!;
                return layout.y + layout.h;
            }),
        );

        const panelId = before.addPanelToGroup(DashboardPanelType.Treemap);
        const after = useDashboardStore.getState();

        expect(after.groups[0]?.panelIds.at(-1)).toBe(panelId);
        expect(after.savedGridLayouts[panelId]?.layout).toMatchObject({ h: 20, w: 12, x: 0, y: previousBottom });
    });

    it('clears auxiliary state when a panel is removed', async () => {
        const panelId = useDashboardStore.getState().addPanelToGroup(DashboardPanelType.Footprint);
        attachPanelSettings(panelId);

        await useDashboardStore.getState().removePanel(panelId);

        expect(useDashboardStore.getState().panels.some((panel) => panel.id === panelId)).toBe(false);
        expectPanelSettingsRemoved(panelId);
    });
});
