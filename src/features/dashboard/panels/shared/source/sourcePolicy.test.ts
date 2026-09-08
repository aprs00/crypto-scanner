import { describe, expect, it } from 'vitest';

import { ExchangeId } from '@/services/exchanges/types';

import { DashboardPanelType } from '../../../model/panelTypes';
import { allowedExchangesForPanel } from './sourcePolicy';

describe('market panel source policy', () => {
    it('excludes Hyperliquid from TradingView panels', () => {
        expect(allowedExchangesForPanel(DashboardPanelType.TradingView)).toEqual([
            ExchangeId.Binance,
            ExchangeId.Bybit,
        ]);
    });

    it('allows every streaming exchange for native market panels', () => {
        expect(allowedExchangesForPanel(DashboardPanelType.Depth)).toEqual([
            ExchangeId.Binance,
            ExchangeId.Hyperliquid,
            ExchangeId.Bybit,
        ]);
    });
});
