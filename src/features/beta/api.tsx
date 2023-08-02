import ky from 'ky';
import {useQueries} from '@tanstack/react-query';

import type {KlinesResponseType} from './types';

const fetchHeatMapData = async (): Promise<any> => {
    // const data = await ky.get('http://64.225.101.235:8000/pearson-correlation/3m', {
    //     headers: {
    //         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    //     },
    //     retry: 1
    // }).json();
    // return data;

    // rewrite above code using fetch
    const backendUrl = 'http://64.225.101.235:8000/average-price/select';
    const data = [];

    // Fetch data from the backend server
    // fetch(backendUrl, { redirect: 'manual' })
    //   .then((response) => {
    //     if (response.status === 307) {
    //       // Handle the redirect manually by fetching from the new URL
    //       return fetch(response.headers.get('Location'));
    //     } else {
    //       return response.json();
    //     }
    //   })
    //   .then((data) => data = data)
    //   .catch((error) => console.error('Error fetching data:', error));

}

const useHeatMapData = () => useQueries({
    queries: [{
        queryKey: ['heatmap'],
        queryFn: () => fetchHeatMapData(),
        refetchInterval: 120_000,
        cacheTime: 120_000,
        refetchOnWindowFocus: false,
    }],
});

const fetchKlines = async (symbol: string, interval = '1m', limit = 500): Promise<KlinesResponseType> => {
    const data = (await ky
        .get(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
        .json()) as KlinesResponseType;
    return data;
};

const useKlines = (symbols: string[]) =>
    useQueries({
        queries: symbols.map((ticker: string) => ({
            queryKey: ['kline', ticker],
            queryFn: () => fetchKlines(ticker),
            refetchInterval: 120_000,
            cacheTime: 120_000,
            refetchOnWindowFocus: false,
        })),
    });

export {useKlines, fetchKlines, useHeatMapData};

// [
//     [
//       1499040000000,      // Kline open time
//       "0.01634790",       // Open price
//       "0.80000000",       // High price
//       "0.01575800",       // Low price
//       "0.01577100",       // Close price
//       "148976.11427815",  // Volume
//       1499644799999,      // Kline Close time
//       "2434.19055334",    // Quote asset volume
//       308,                // Number of trades
//       "1756.87402397",    // Taker buy base asset volume
//       "28.46694368",      // Taker buy quote asset volume
//       "0"                 // Unused field, ignore.
//     ]
// ]
