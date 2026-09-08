import { describe, expect, it } from 'vitest';

import { createDefaultDashboardPanels } from './panelRegistry';
import { DashboardPanelType, DEFAULT_GROUP_ID } from './panelTypes';
import { normalizeDashboardPersistence, type DashboardPersistedState } from './persistence';

const fallbackState = (): DashboardPersistedState => {
    let id = 0;
    const dashboard = createDefaultDashboardPanels(() => `fallback-${id++}`);
    return {
        activeGroupId: DEFAULT_GROUP_ID,
        groups: [{ id: DEFAULT_GROUP_ID, name: 'Default', panelIds: dashboard.panels.map((panel) => panel.id) }],
        panels: dashboard.panels,
        savedGridLayouts: dashboard.savedGridLayouts,
    };
};

describe('dashboard persistence normalization', () => {
    it('preserves an explicitly empty dashboard', () => {
        expect(
            normalizeDashboardPersistence(
                { activeGroupId: DEFAULT_GROUP_ID, groups: [], panels: [], savedGridLayouts: {} },
                fallbackState(),
            ),
        ).toEqual({
            activeGroupId: DEFAULT_GROUP_ID,
            groups: [{ id: DEFAULT_GROUP_ID, name: 'Default', panelIds: [] }],
            panels: [],
            savedGridLayouts: {},
        });
    });

    it('falls back when the panel list is malformed', () => {
        const fallback = fallbackState();
        expect(
            normalizeDashboardPersistence(
                { panels: [{ id: 'bad', type: 'unknown' }], groups: [], savedGridLayouts: {} },
                fallback,
            ),
        ).toBe(fallback);
    });

    it('repairs groups and strips stale or invalid layouts', () => {
        const normalized = normalizeDashboardPersistence(
            {
                activeGroupId: 'missing',
                groups: [
                    { id: 'research', name: 'Research', panelIds: ['panel-a', 'missing', 'panel-a'] },
                    { id: 'research', name: 'Duplicate', panelIds: ['panel-b'] },
                ],
                panels: [
                    { id: 'panel-a', type: DashboardPanelType.BetaHeatmap },
                    { id: 'panel-b', type: DashboardPanelType.Depth },
                ],
                savedGridLayouts: {
                    'panel-a': { layout: { h: 20, i: 'wrong', w: 12, x: 0, y: 0 } },
                    'panel-b': { layout: { h: -1, i: 'panel-b', w: 12, x: 0, y: 0 } },
                    stale: { layout: { h: 10, i: 'stale', w: 12, x: 0, y: 0 } },
                },
            },
            fallbackState(),
        );

        expect(normalized.activeGroupId).toBe(DEFAULT_GROUP_ID);
        expect(normalized.groups).toEqual([
            { id: DEFAULT_GROUP_ID, name: 'Default', panelIds: ['panel-b'] },
            { id: 'research', name: 'Research', panelIds: ['panel-a'] },
        ]);
        expect(normalized.savedGridLayouts).toEqual({
            'panel-a': { layout: { h: 20, i: 'panel-a', w: 12, x: 0, y: 0 } },
            'panel-b': {},
        });
    });
});
