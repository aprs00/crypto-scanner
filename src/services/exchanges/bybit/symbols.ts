import { bybitInstance } from '@/lib/api';

import type { ExchangeSymbol } from '../types';

type BybitInstrument = {
    symbol: string;
    baseCoin: string;
    quoteCoin: string;
    status: string;
    contractType: string;
    priceFilter: { tickSize: string };
};

type BybitInstrumentsResponse = {
    result: { list: BybitInstrument[]; nextPageCursor: string };
};

const PAGE_LIMIT = 1_000;

const normalizeBybitSymbols = (instruments: readonly BybitInstrument[]): ExchangeSymbol[] =>
    instruments.flatMap((instrument) => {
        if (
            instrument.status !== 'Trading' ||
            instrument.quoteCoin !== 'USDT' ||
            instrument.contractType !== 'LinearPerpetual'
        ) {
            return [];
        }
        const tickSize = Number(instrument.priceFilter.tickSize);
        if (!instrument.symbol || !instrument.baseCoin || !Number.isFinite(tickSize) || tickSize <= 0) return [];
        return [
            {
                base: instrument.baseCoin,
                label: instrument.symbol,
                symbol: instrument.symbol,
                tickSize,
            },
        ];
    });

export const fetchBybitSymbols = async (): Promise<ExchangeSymbol[]> => {
    const instruments: BybitInstrument[] = [];
    let cursor = '';
    do {
        const { data } = await bybitInstance.get<BybitInstrumentsResponse>('/v5/market/instruments-info', {
            params: { category: 'linear', cursor: cursor || undefined, limit: PAGE_LIMIT },
        });
        instruments.push(...data.result.list);
        cursor = data.result.nextPageCursor;
    } while (cursor);

    // USDT-margined perpetuals only — matches toTradingViewSymbol's `.P` suffix
    // and the linear public WS feed.
    return normalizeBybitSymbols(instruments);
};
