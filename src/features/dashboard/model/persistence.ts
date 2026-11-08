import type { Layout } from 'react-grid-layout';

import type { ExchangeChartConfig } from '../panels/shared/settings/config';
import type { DashboardGroup, DashboardPanelItem, DashboardPanelLayout } from './panelTypes';

import { CointegrationMetric, DataType, SortDirection, TimePeriodType } from '../panels/shared/settings/config';
import { DashboardPanelType, DEFAULT_GROUP_ID } from './panelTypes';

export const DASHBOARD_PERSISTENCE_VERSION = 1;

export type DashboardPersistedState = {
    activeGroupId: string;
    groups: DashboardGroup[];
    panels: DashboardPanelItem[];
    savedGridLayouts: Record<string, DashboardPanelLayout>;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const panelTypes = new Set<string>(Object.values(DashboardPanelType));

const isPanelType = (value: unknown): value is DashboardPanelItem['type'] =>
    typeof value === 'string' && panelTypes.has(value);

// Panel types that were removed from the app. Saved dashboards drop them instead of resetting.
const retiredPanelTypes = new Set<unknown>(['footprint']);

const normalizePanels = (value: unknown): DashboardPanelItem[] | null => {
    if (!Array.isArray(value)) return null;

    const ids = new Set<string>();
    const panels: DashboardPanelItem[] = [];

    for (const item of value) {
        if (isRecord(item) && retiredPanelTypes.has(item.type)) continue;
        if (!isRecord(item) || !isNonEmptyString(item.id) || !isPanelType(item.type) || ids.has(item.id)) return null;
        ids.add(item.id);
        panels.push({ id: item.id, type: item.type });
    }

    return panels;
};

const normalizeLayout = (value: unknown, panelId: string): Layout | undefined => {
    if (!isRecord(value)) return undefined;
    const { h, w, x, y } = value;
    const dimensions = [h, w, x, y];
    return (
        (dimensions.every((dimension) => typeof dimension === 'number' && Number.isFinite(dimension)) &&
            dimensions.every(Number.isInteger) &&
            (h as number) >= 1 &&
            (w as number) >= 1 &&
            (w as number) <= 12 &&
            (x as number) >= 0 &&
            (x as number) <= 11 &&
            (y as number) >= 0 &&
            (x as number) + (w as number) <= 12 && {
                h: h as number,
                i: panelId,
                w: w as number,
                x: x as number,
                y: y as number,
            }) ||
        undefined
    );
};

const optionalString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const stringArray = (value: unknown): string[] | undefined =>
    Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : undefined;

const enumValue = <T extends string>(value: unknown, domain: Readonly<Record<string, T>>): T | undefined =>
    typeof value === 'string' && Object.values(domain).includes(value as T) ? (value as T) : undefined;

const normalizeExchangeConfig = (value: unknown): ExchangeChartConfig => {
    if (!isRecord(value)) return {};

    const config: ExchangeChartConfig = {};
    const stringFields = ['hours', 'xAxis', 'yAxis', 'zAxis', 'symbol', 'baseSymbol', 'window', 'sort'] as const;
    for (const field of stringFields) {
        const normalized = optionalString(value[field]);
        if (normalized !== undefined) config[field] = normalized;
    }

    const comparisonSymbols = stringArray(value.comparisonSymbols);
    const symbols = stringArray(value.symbols);
    const dataType = enumValue(value.dataType, DataType);
    const periodType = enumValue(value.periodType, TimePeriodType);
    const sortDirection = enumValue(value.sortDirection, SortDirection);
    const cointegrationMetric = enumValue(value.cointegrationMetric, CointegrationMetric);

    if (comparisonSymbols) config.comparisonSymbols = comparisonSymbols;
    if (symbols) config.symbols = symbols;
    if (dataType) config.dataType = dataType;
    if (periodType) config.periodType = periodType;
    if (sortDirection) config.sortDirection = sortDirection;
    if (cointegrationMetric) config.cointegrationMetric = cointegrationMetric;
    if (typeof value.limit === 'number' && Number.isFinite(value.limit) && value.limit >= 0) {
        config.limit = Math.floor(value.limit);
    }

    return config;
};

const normalizeExchangeConfigs = (value: unknown): DashboardPanelLayout['exchangeConfigs'] => {
    if (!isRecord(value)) return undefined;

    return Object.fromEntries(
        Object.entries(value)
            .filter(([exchange]) => exchange.trim().length > 0)
            .map(([exchange, config]) => [exchange, normalizeExchangeConfig(config)]),
    );
};

const normalizeSavedLayouts = (value: unknown, panelIds: ReadonlySet<string>): Record<string, DashboardPanelLayout> => {
    if (!isRecord(value)) return {};

    const layouts: Record<string, DashboardPanelLayout> = {};
    for (const [panelId, candidate] of Object.entries(value)) {
        if (!panelIds.has(panelId) || !isRecord(candidate)) continue;

        const savedLayout: DashboardPanelLayout = {};
        const layout = normalizeLayout(candidate.layout, panelId);
        const exchange = optionalString(candidate.exchange);
        const exchangeConfigs = normalizeExchangeConfigs(candidate.exchangeConfigs);

        if (layout) savedLayout.layout = layout;
        if (exchange) savedLayout.exchange = exchange;
        if (exchangeConfigs) savedLayout.exchangeConfigs = exchangeConfigs;
        layouts[panelId] = savedLayout;
    }

    return layouts;
};

const normalizeGroups = (value: unknown, panelIds: ReadonlySet<string>): DashboardGroup[] => {
    const groups: DashboardGroup[] = [];
    const groupIds = new Set<string>();
    const assignedPanelIds = new Set<string>();

    if (Array.isArray(value)) {
        for (const candidate of value) {
            if (!isRecord(candidate) || !isNonEmptyString(candidate.id) || groupIds.has(candidate.id)) continue;

            const candidatePanelIds = Array.isArray(candidate.panelIds) ? candidate.panelIds : [];
            const normalizedPanelIds: string[] = [];
            for (const panelId of candidatePanelIds) {
                if (typeof panelId !== 'string' || !panelIds.has(panelId) || assignedPanelIds.has(panelId)) continue;
                assignedPanelIds.add(panelId);
                normalizedPanelIds.push(panelId);
            }

            groupIds.add(candidate.id);
            groups.push({
                id: candidate.id,
                name:
                    (isNonEmptyString(candidate.name) && candidate.name.trim()) ||
                    (candidate.id === DEFAULT_GROUP_ID ? 'Default' : 'Untitled'),
                panelIds: normalizedPanelIds,
            });
        }
    }

    let defaultGroup = groups.find((group) => group.id === DEFAULT_GROUP_ID);
    if (!defaultGroup) {
        defaultGroup = { id: DEFAULT_GROUP_ID, name: 'Default', panelIds: [] };
        groups.unshift(defaultGroup);
    }

    for (const panelId of panelIds) {
        if (!assignedPanelIds.has(panelId)) defaultGroup.panelIds.push(panelId);
    }

    return groups;
};

export const normalizeDashboardPersistence = (
    value: unknown,
    fallback: DashboardPersistedState,
): DashboardPersistedState => {
    if (!isRecord(value)) return fallback;

    const panels = normalizePanels(value.panels);
    if (!panels) return fallback;

    const panelIds = new Set(panels.map((panel) => panel.id));
    const groups = normalizeGroups(value.groups, panelIds);
    const activeGroupId =
        typeof value.activeGroupId === 'string' && groups.some((group) => group.id === value.activeGroupId)
            ? value.activeGroupId
            : DEFAULT_GROUP_ID;

    return {
        activeGroupId,
        groups,
        panels,
        savedGridLayouts: normalizeSavedLayouts(value.savedGridLayouts, panelIds),
    };
};
