import { hyperliquidInstance } from '@/lib/api';

import type { ExchangeSymbol } from '../types';

// Perps allow up to MAX_DECIMALS - szDecimals price decimals; we use that as
// the grouping tick. Spot would use 8 here.
const PERP_MAX_DECIMALS = 6;

type HlMeta = { universe: { name: string; szDecimals: number; isDelisted?: boolean }[] };

export const fetchHyperliquidSymbols = async (): Promise<ExchangeSymbol[]> => {
    const { data } = await hyperliquidInstance.post<HlMeta>('/info', { type: 'meta' });
    return data.universe
        .filter((asset) => !asset.isDelisted)
        .map((asset) => ({
            base: asset.name,
            label: `${asset.name}-PERP`,
            symbol: asset.name,
            tickSize: 10 ** -(PERP_MAX_DECIMALS - asset.szDecimals),
        }));
};
