import type { ExchangeInfoResponseType } from '@/routes/~chart/types';

import { binanceInstance } from '@/lib/api';

import type { ExchangeSymbol } from '../types';

export const fetchBinanceSymbols = async (): Promise<ExchangeSymbol[]> => {
    const { data } = await binanceInstance.get<ExchangeInfoResponseType>('api/v3/exchangeInfo');
    return data.symbols
        .filter((s) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
        .map((s) => {
            const priceFilter = s.filters.find((f) => f.filterType === 'PRICE_FILTER');
            return {
                base: s.baseAsset,
                label: s.symbol,
                symbol: s.symbol,
                tickSize: Number(priceFilter?.tickSize ?? 0),
            };
        });
};
