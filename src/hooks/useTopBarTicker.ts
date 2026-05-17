import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';

const TICKER_SYMBOLS = ['BTCUSDT', 'ETHUSDT'] as const;

type BinanceMiniTicker = {
    s: string; // symbol
    c: string; // close
    o: string; // open
};

type FearGreedResponse = {
    data: { value: string; value_classification: string; timestamp: string }[];
};

export type TopBarPrice = {
    price: number;
    changePercent: number;
};

export type TopBarTicker = {
    btc?: TopBarPrice;
    eth?: TopBarPrice;
    fearGreed?: { value: number; classification: string };
};

const buildStreamUrl = () => {
    const streams = TICKER_SYMBOLS.map((s) => `${s.toLowerCase()}@miniTicker`).join('/');
    return `wss://stream.binance.com:9443/stream?streams=${streams}`;
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
        const ws = new WebSocket(buildStreamUrl());

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
            const { data } = await axios.get<FearGreedResponse>('https://api.alternative.me/fng/?limit=1');
            const latest = data?.data?.[0];
            if (!latest) return null;
            return {
                value: Number(latest.value),
                classification: latest.value_classification,
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
        eth: prices.ETHUSDT,
        fearGreed: fg.data ?? undefined,
    };
};

export default useTopBarTicker;
