import type { ExchangeId } from '@/services/exchanges/types';

import { STREAMING_EXCHANGES, TRADINGVIEW_EXCHANGES } from '@/services/exchanges/registry';

import { DashboardPanelType, type DashboardPanelType as PanelType } from '../../../model/panelTypes';

export const allowedExchangesForPanel = (panelType: PanelType): readonly ExchangeId[] =>
    panelType === DashboardPanelType.TradingView ? TRADINGVIEW_EXCHANGES : STREAMING_EXCHANGES;
