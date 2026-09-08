export type { LocalOrderBook, OrderBookLevel } from '@/services/exchanges/types';

// Which tick-chart sub-series are shown. The main price band is always on; these
// four can be independently toggled (and a disabled one is removed entirely).
export type SeriesVisibility = { spread: boolean; volume: boolean; liquidity: boolean; book: boolean };

export const Orientation = {
    V: 'V',
    H: 'H',
} as const;

export type Orientation = (typeof Orientation)[keyof typeof Orientation];
