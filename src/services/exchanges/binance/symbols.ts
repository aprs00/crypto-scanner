import { binanceFuturesInstance } from '@/lib/api';

import type { ExchangeSymbol } from '../types';
import type { BinanceFuturesExchangeInfoResponse, BinanceFuturesSymbolInfo } from './types';

export const BINANCE_FUTURES_EXCHANGE_INFO_PATH = '/fapi/v1/exchangeInfo';

export const normalizeBinanceFuturesSymbols = (symbols: readonly BinanceFuturesSymbolInfo[]): ExchangeSymbol[] =>
    symbols.flatMap((symbol) => {
        if (
            symbol.status !== 'TRADING' ||
            symbol.contractType !== 'PERPETUAL' ||
            symbol.quoteAsset !== 'USDT' ||
            symbol.marginAsset !== 'USDT'
        ) {
            return [];
        }

        const priceFilter = symbol.filters.find((filter) => filter.filterType === 'PRICE_FILTER');
        const tickSize = Number(priceFilter?.tickSize);
        if (!symbol.symbol || !symbol.baseAsset || !Number.isFinite(tickSize) || tickSize <= 0) return [];

        return [
            {
                base: symbol.baseAsset,
                label: symbol.symbol,
                symbol: symbol.symbol,
                tickSize,
            },
        ];
    });

export const fetchBinanceSymbols = async (): Promise<ExchangeSymbol[]> => {
    const { data } = await binanceFuturesInstance.get<BinanceFuturesExchangeInfoResponse>(
        BINANCE_FUTURES_EXCHANGE_INFO_PATH,
    );
    return normalizeBinanceFuturesSymbols(data.symbols);
};
