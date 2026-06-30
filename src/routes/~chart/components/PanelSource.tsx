import type { ExchangeId } from '@/services/exchanges/types';

import CSSelect from '@/components/UI/CSSelect';
import { STREAMING_EXCHANGES, TRADINGVIEW_EXCHANGES, getExchange } from '@/services/exchanges/registry';

import { PanelType } from '../types';
import useChartSourceStore from '../useChartSourceStore';
import useResolvedSource from '../useResolvedSource';

// TradingView has Binance/Bybit feeds but no Hyperliquid; other panels need WS
// streaming (order book + trades), which Binance, Hyperliquid and Bybit implement.
export const allowedExchanges = (panelType: PanelType): ExchangeId[] =>
    panelType === PanelType.TradingView ? TRADINGVIEW_EXCHANGES : STREAMING_EXCHANGES;

const PanelSource = ({ panelId, panelType }: { panelId: string; panelType: PanelType }) => {
    const { exchange, symbol, symbols } = useResolvedSource(panelId, panelType);
    const setExchange = useChartSourceStore((state) => state.setExchange);
    const setSymbol = useChartSourceStore((state) => state.setSymbol);

    const exchangeOptions: Record<string, ExchangeId> = Object.fromEntries(
        allowedExchanges(panelType).map((id) => [getExchange(id).label, id]),
    );
    const symbolOptions: Record<string, string> = Object.fromEntries(symbols.map((s) => [s.label, s.symbol]));

    const handleSymbol = (value: string) => {
        const picked = symbols.find((s) => s.symbol === value);
        setSymbol(panelId, value, picked?.base ?? value);
    };

    return (
        <>
            <CSSelect<ExchangeId>
                onChange={(ex) => setExchange(panelId, ex)}
                options={exchangeOptions}
                value={exchange}
            />
            <CSSelect<string> onChange={handleSymbol} options={symbolOptions} value={symbol || undefined} />
        </>
    );
};

export default PanelSource;
