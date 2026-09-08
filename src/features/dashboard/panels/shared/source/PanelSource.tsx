import type { ExchangeId } from '@/services/exchanges/types';

import CSSelect from '@/components/UI/CSSelect';
import { getExchange } from '@/services/exchanges/registry';

import type { DashboardPanelType } from '../../../model/panelTypes';

import { allowedExchangesForPanel } from './sourcePolicy';
import useChartSourceStore from './useChartSourceStore';
import useResolvedSource from './useResolvedSource';

const PanelSource = ({ panelId, panelType }: { panelId: string; panelType: DashboardPanelType }) => {
    const { exchange, symbol, symbols } = useResolvedSource(panelId, panelType);
    const setExchange = useChartSourceStore((state) => state.setExchange);
    const setSymbol = useChartSourceStore((state) => state.setSymbol);

    const exchangeOptions: Record<string, ExchangeId> = Object.fromEntries(
        allowedExchangesForPanel(panelType).map((id) => [getExchange(id).label, id]),
    );
    const symbolOptions: Record<string, string> = Object.fromEntries(symbols.map((s) => [s.label, s.symbol]));
    const handleExchange = (value: ExchangeId) => setExchange(panelId, value);

    const handleSymbol = (value: string) => {
        const picked = symbols.find((s) => s.symbol === value);
        setSymbol(panelId, value, picked?.base ?? value);
    };

    return (
        <>
            <CSSelect<ExchangeId>
                ariaLabel="Exchange"
                onChange={handleExchange}
                options={exchangeOptions}
                value={exchange}
            />
            <CSSelect<string>
                ariaLabel="Symbol"
                onChange={handleSymbol}
                options={symbolOptions}
                value={symbol || undefined}
            />
        </>
    );
};

export default PanelSource;
