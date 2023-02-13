import {useState} from 'react';

import BetaTable from '../components/BetaTable';
import {useDepthSnapshot, useStreamTicker, streamTicker} from '../api';
import type {UpdateOrderBookPropsType} from '../types';
import {useQueries} from '@tanstack/react-query';

const betaTickersList = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'];

const Beta = () => {
    const results = useQueries({
        queries: betaTickersList.map((ticker) => ({
            queryKey: ['ticker', ticker],
            queryFn: () => streamTicker(ticker),
            enabled: !!ticker,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
        })),
    });

    console.log(results);

    // create a function that will get price in difference for each ticker from the results
    const getPrices = (results: any) => {
        const prices = results.map((result: any) => {
            const {data} = result;
            return data;
        });

        return prices;
    };

    console.log(getPrices(results));

    return (
        <div>
            <h1 className="text-2xl text-teal-400 mb-2">24h BETA</h1>
            <BetaTable />
        </div>
    );
};

export default Beta;
