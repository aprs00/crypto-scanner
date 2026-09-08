import type { ReactNode } from 'react';

import { createContext, use } from 'react';

import type { ExchangeChartConfig } from '../panels/shared/settings/config';

export type DashboardPanelActions = {
    setChartExchange: (panelId: string, exchange: string) => void;
    updateExchangeConfig: (panelId: string, exchange: string, config: ExchangeChartConfig) => void;
};

const DashboardPanelActionsContext = createContext<DashboardPanelActions | null>(null);

type DashboardPanelActionsProviderProps = {
    children: ReactNode;
    value: DashboardPanelActions;
};

export const DashboardPanelActionsProvider = ({ children, value }: DashboardPanelActionsProviderProps) => (
    <DashboardPanelActionsContext value={value}>{children}</DashboardPanelActionsContext>
);

export const useDashboardPanelActions = (): DashboardPanelActions => {
    const actions = use(DashboardPanelActionsContext);
    if (!actions) throw new Error('Dashboard panels must be rendered inside DashboardPanelActionsProvider.');
    return actions;
};
