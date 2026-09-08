import { hyperliquidInstance } from '@/lib/api';

import type { ExchangeSymbol } from '../types';

const PERP_MAX_DECIMALS = 6;
const MAX_PRICE_SIGNIFICANT_FIGURES = 5;

type HlMeta = { universe: { name: string; szDecimals: number; isDelisted?: boolean }[] };
type HlAssetContext = {
    markPx?: string | null;
    midPx?: string | null;
    oraclePx?: string | null;
    prevDayPx?: string | null;
};
type HlMetaAndAssetCtxs = [HlMeta, HlAssetContext[]];

const referencePrice = (context: HlAssetContext | undefined): number => {
    for (const candidate of [context?.midPx, context?.markPx, context?.oraclePx, context?.prevDayPx]) {
        const price = Number(candidate);
        if (Number.isFinite(price) && price > 0) return price;
    }
    return 0;
};

const hyperliquidTickSize = (szDecimals: number, price: number): number => {
    const normalizedSizeDecimals =
        Number.isInteger(szDecimals) && szDecimals >= 0 ? Math.min(PERP_MAX_DECIMALS, szDecimals) : 0;
    const decimalLimitTick = 10 ** -(PERP_MAX_DECIMALS - normalizedSizeDecimals);
    if (!Number.isFinite(price) || price <= 0) return decimalLimitTick;

    // Hyperliquid also limits non-integer prices to five significant figures.
    // Around the current market this can be coarser than the decimal-place
    // ceiling (for example, BTC uses $1 ticks near $65k, not $0.10).
    const significantFigureTick =
        10 ** Math.min(0, Math.floor(Math.log10(price)) - (MAX_PRICE_SIGNIFICANT_FIGURES - 1));
    return Math.max(decimalLimitTick, significantFigureTick);
};

export const fetchHyperliquidSymbols = async (): Promise<ExchangeSymbol[]> => {
    const { data } = await hyperliquidInstance.post<HlMetaAndAssetCtxs>('/info', { type: 'metaAndAssetCtxs' });
    const [meta, contexts] = data;
    return meta.universe.flatMap((asset, index) =>
        asset.isDelisted
            ? []
            : [
                  {
                      base: asset.name,
                      label: `${asset.name}-PERP`,
                      symbol: asset.name,
                      tickSize: hyperliquidTickSize(asset.szDecimals, referencePrice(contexts[index])),
                  },
              ],
    );
};
