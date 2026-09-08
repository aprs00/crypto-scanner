import CSSelect from '@/components/UI/CSSelect';
import { getExchange } from '@/services/exchanges/registry';
import { ExchangeId, type ExchangeId as ExchangeIdValue } from '@/services/exchanges/types';

import type { FootprintMarket } from './types';

import useFootprintSettingsStore from './useFootprintSettingsStore';

type Props = {
    marketKey: string | undefined;
    markets: FootprintMarket[];
    panelId: string;
};

const FootprintSource = ({ marketKey, markets, panelId }: Props) => {
    const setMarketKey = useFootprintSettingsStore((state) => state.setMarketKey);
    const selectedMarket = markets.find((market) => market.marketKey === marketKey) ?? markets[0];
    const selectedExchange = selectedMarket?.exchange;
    const exchangeOptions: Record<string, ExchangeIdValue> = Object.fromEntries(
        [...new Set(markets.map((market) => market.exchange))].map((exchange) => [
            getExchange(exchange).label,
            exchange,
        ]),
    );
    const marketsForExchange = markets.filter((market) => market.exchange === selectedExchange);
    const symbolOptions: Record<string, string> = Object.fromEntries(
        marketsForExchange.map((market) => [
            market.exchange === ExchangeId.Hyperliquid ? `${market.symbol}-PERP` : market.symbol,
            market.marketKey,
        ]),
    );

    const handleExchange = (exchange: ExchangeIdValue) => {
        const nextMarket =
            markets.find((market) => market.exchange === exchange && market.baseAsset === selectedMarket?.baseAsset) ??
            markets.find((market) => market.exchange === exchange);
        if (nextMarket) setMarketKey(panelId, nextMarket.marketKey);
    };
    const handleMarket = (nextMarketKey: string) => setMarketKey(panelId, nextMarketKey);

    return (
        <>
            <CSSelect<ExchangeIdValue>
                ariaLabel="Footprint exchange"
                onChange={handleExchange}
                options={exchangeOptions}
                value={selectedExchange}
            />
            <CSSelect<string>
                ariaLabel="Footprint symbol"
                onChange={handleMarket}
                options={symbolOptions}
                value={selectedMarket?.marketKey}
            />
        </>
    );
};

export default FootprintSource;
