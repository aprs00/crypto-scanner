import type { ExchangeId, ExchangeSymbol } from '@/services/exchanges/types';

import { useExchangeSymbols } from '@/services/exchanges/hooks';

import type { DashboardPanelType } from '../../../model/panelTypes';

import { allowedExchangesForPanel } from './sourcePolicy';
import useChartSourceStore, { defaultPanelSource } from './useChartSourceStore';

type ResolvedSource = {
    exchange: ExchangeId;
    symbol: string; // native subscription symbol, validated against the exchange's list
    base: string;
    tickSize: number;
    symbols: ExchangeSymbol[];
};

// Turns a panel's stored {exchange, symbol, base} into a guaranteed-valid native
// symbol for the selected exchange: prefer the exact stored symbol, else the same
// coin (base) on this exchange, else the first listed symbol.
const useResolvedSource = (panelId: string, panelType: DashboardPanelType): ResolvedSource => {
    const stored = useChartSourceStore((state) => state.sources[panelId]) ?? defaultPanelSource;
    // If the persisted exchange isn't valid for this panel type (e.g. HL was set
    // before TradingView added bybit, or an exchange is left over from a TV panel
    // that was switched to OrderBook), fall back to the first allowed option.
    const allowed = allowedExchangesForPanel(panelType);
    const source = allowed.includes(stored.exchange) ? stored : { ...stored, exchange: allowed[0] };
    const symbolsQuery = useExchangeSymbols(source.exchange);
    const symbols = symbolsQuery.data ?? [];

    const resolved =
        symbols.find((s) => s.symbol === source.symbol) ?? symbols.find((s) => s.base === source.base) ?? symbols[0];

    return {
        base: resolved?.base ?? source.base,
        exchange: source.exchange,
        symbol: resolved?.symbol ?? source.symbol,
        symbols,
        tickSize: resolved?.tickSize ?? 0,
    };
};

export default useResolvedSource;
