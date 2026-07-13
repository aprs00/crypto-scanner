import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import externalServiceOrigins from '@/config/externalServices';
import { fearGreedInstance } from '@/lib/api';

const TICKER_SYMBOLS = ['BTCUSDT'] as const;

type BinanceMiniTicker = {
    s: string; // symbol
    c: string; // close
    o: string; // open
};

type FearGreedResponse = {
    data: {
        value: string;
        value_classification: string;
        timestamp: string;
    }[];
};

export type TopBarPrice = {
    price: number;
    changePercent: number;
};

export type TopBarTicker = {
    btc?: TopBarPrice;
    fearGreed?: { value: number };
};

export const buildBinanceFuturesMiniTickerUrl = () => {
    const streams = TICKER_SYMBOLS.map((s) => `${s.toLowerCase()}@miniTicker`).join('/');
    return `${externalServiceOrigins.binanceFuturesWS}/market/stream?streams=${streams}`;
};

const toPrice = ({ c, o }: BinanceMiniTicker): TopBarPrice => {
    const price = Number(c);
    const open = Number(o);
    const changePercent = open > 0 ? ((price - open) / open) * 100 : 0;
    return { price, changePercent };
};

const useBinanceTopTickers = () => {
    const [prices, setPrices] = useState<Record<string, TopBarPrice>>({});

    useEffect(() => {
        const ws = new WebSocket(buildBinanceFuturesMiniTickerUrl());

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data) as { stream: string; data: BinanceMiniTicker };
            const ticker = msg.data;
            if (!ticker || !ticker.s) return;
            setPrices((prev) => ({ ...prev, [ticker.s]: toPrice(ticker) }));
        };

        return () => ws.close();
    }, []);

    return prices;
};

const useFearGreed = () =>
    useQuery({
        queryKey: ['fear-greed'],
        queryFn: async () => {
            const { data } = await fearGreedInstance.get<FearGreedResponse>('/fng/', { params: { limit: 1 } });
            const latest = data?.data?.[0];
            if (!latest) return null;
            return {
                value: Number(latest.value),
            };
        },
        refetchInterval: 5 * 60_000,
        staleTime: 4 * 60_000,
    });

const useTopBarTicker = (): TopBarTicker => {
    const prices = useBinanceTopTickers();
    const fg = useFearGreed();

    return {
        btc: prices.BTCUSDT,
        fearGreed: fg.data ?? undefined,
    };
};

export default useTopBarTicker;
