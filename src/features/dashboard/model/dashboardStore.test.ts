import { beforeEach, describe, expect, it } from 'vitest';

import useFootprintSettingsStore, { defaultFootprintSettings } from '../panels/footprint/useFootprintSettingsStore';
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
    const panel = useDashboardStore.getState().panels.find((candidate) => candidate.id === panelId);
    if (panel?.type === DashboardPanelType.Footprint) {
        useFootprintSettingsStore.getState().setSettings(panelId, defaultFootprintSettings);
    }
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
        const panelId = useDashboardStore.getState().panels[0]!.id;
        attachPanelSettings(panelId);

        await useDashboardStore.getState().removePanel(panelId);

        expect(useDashboardStore.getState().panels.some((panel) => panel.id === panelId)).toBe(false);
        expectPanelSettingsRemoved(panelId);
    });

    it('clears every panel and its auxiliary state when a group is deleted', async () => {
        const store = useDashboardStore.getState();
        const groupId = store.createGroup('Trading');
        const firstPanelId = useDashboardStore.getState().addPanelToGroup(DashboardPanelType.Tick, groupId);
        const secondPanelId = useDashboardStore.getState().addPanelToGroup(DashboardPanelType.Footprint, groupId);
        attachPanelSettings(firstPanelId);
        attachPanelSettings(secondPanelId);

        await useDashboardStore.getState().deleteGroup(groupId);

        const after = useDashboardStore.getState();
        expect(after.groups.some((group) => group.id === groupId)).toBe(false);
        expect(after.activeGroupId).toBe(DEFAULT_GROUP_ID);
        expect(after.panels.some((panel) => panel.id === firstPanelId || panel.id === secondPanelId)).toBe(false);
        expectPanelSettingsRemoved(firstPanelId);
        expectPanelSettingsRemoved(secondPanelId);
    });

    it('preserves another panel settings when a market panel is removed', async () => {
        const footprintId = useDashboardStore.getState().addPanelToGroup(DashboardPanelType.Footprint);
        const tickId = useDashboardStore.getState().addPanelToGroup(DashboardPanelType.Tick);
        attachPanelSettings(footprintId);
        attachPanelSettings(tickId);

        await useDashboardStore.getState().removePanel(tickId);

        expectPanelSettingsRemoved(tickId);
        expect(useChartSourceStore.getState().sources[footprintId]?.symbol).toBe('ETHUSDT');
        expect(useChartSeriesStore.getState().visibility[footprintId]?.book).toBe(false);
        expect(useFootprintSettingsStore.getState().settings[footprintId]).toEqual(defaultFootprintSettings);
    });
});
