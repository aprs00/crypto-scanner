import { describe, expect, it, vi } from 'vitest';

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

    it('drops retired panel types without resetting the dashboard', () => {
        const retiredTypes = ['footprint', 'cointegrationPairHistory', 'cointegrationLiveTable'];
        const normalized = normalizeDashboardPersistence(
            {
                panels: [
                    { id: 'panel-a', type: DashboardPanelType.BetaHeatmap },
                    ...retiredTypes.map((type) => ({ id: type, type })),
                ],
                groups: [{ id: DEFAULT_GROUP_ID, name: 'Default', panelIds: ['panel-a', ...retiredTypes] }],
                savedGridLayouts: Object.fromEntries(
                    retiredTypes.map((type) => [type, { layout: { h: 14, i: type, w: 12, x: 0, y: 0 } }]),
                ),
            },
            fallbackState(),
        );

        expect(normalized.panels).toEqual([{ id: 'panel-a', type: DashboardPanelType.BetaHeatmap }]);
        expect(normalized.groups).toEqual([{ id: DEFAULT_GROUP_ID, name: 'Default', panelIds: ['panel-a'] }]);
        expect(normalized.savedGridLayouts).toEqual({});
    });

    it('strips settings that only retired panels used', () => {
        const normalized = normalizeDashboardPersistence(
            {
                panels: [{ id: 'panel-a', type: DashboardPanelType.BetaHeatmap }],
                groups: [],
                savedGridLayouts: {
                    'panel-a': {
                        exchangeConfigs: {
                            binance: {
                                cointegrationMetric: 'spread_z',
                                hours: '4',
                                limit: 50,
                                sort: 'abs_z',
                                sortDirection: 'desc',
                                window: '1440',
                            },
                        },
                    },
                },
            },
            fallbackState(),
        );

        expect(normalized.savedGridLayouts['panel-a']?.exchangeConfigs).toEqual({ binance: { hours: '4' } });
    });

    it('rewrites stored dashboards so retired panels leave browser storage', async () => {
        const stored = new Map([
            [
                'dashboard-layout',
                JSON.stringify({
                    state: {
                        activeGroupId: DEFAULT_GROUP_ID,
                        groups: [{ id: DEFAULT_GROUP_ID, name: 'Default', panelIds: ['panel-a', 'retired'] }],
                        panels: [
                            { id: 'panel-a', type: DashboardPanelType.BetaHeatmap },
                            { id: 'retired', type: 'cointegrationLiveTable' },
                        ],
                        savedGridLayouts: {
                            retired: { exchangeConfigs: { binance: { cointegrationMetric: 'adf_t' } } },
                        },
                    },
                    version: 1,
                }),
            ],
        ]);
        vi.stubGlobal('window', {
            localStorage: {
                getItem: (key: string) => stored.get(key) ?? null,
                removeItem: (key: string) => stored.delete(key),
                setItem: (key: string, value: string) => stored.set(key, value),
            },
        });
        vi.resetModules();

        await import('./dashboardStore');
        vi.unstubAllGlobals();

        expect(stored.get('dashboard-layout')).toContain('panel-a');
        expect(stored.get('dashboard-layout')).not.toMatch(/retired|cointegration/);
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
