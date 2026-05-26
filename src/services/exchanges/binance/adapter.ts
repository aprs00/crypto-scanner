import type { ExchangeInfoResponseType } from '@/routes/~chart/types';

import { binanceInstance } from '@/lib/api';
import BinanceOrderBookService from '@/services/binance/OrderbookService';

import type { ExchangeAdapter, ExchangeSymbol, OrderBookSubscriber, TradeSubscriber } from '../types';

import { subscribeAggTrades } from './trades';

const binance: ExchangeAdapter = {
    id: 'binance',
    label: 'BINANCE',

    fetchSymbols: async (): Promise<ExchangeSymbol[]> => {
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
    },

    subscribeOrderBook: (symbol: string, cb: OrderBookSubscriber): (() => void) => {
        const service = new BinanceOrderBookService(symbol, cb);
        service.initialize();
        return () => service.close();
    },

    subscribeTrades: (symbol: string, cb: TradeSubscriber): (() => void) => subscribeAggTrades(symbol, cb),

    toTradingViewSymbol: (symbol: string): string => `BINANCE:${symbol}`,
};

export default binance;
