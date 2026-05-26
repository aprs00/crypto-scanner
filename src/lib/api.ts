import axios, { type CreateAxiosDefaults } from 'axios';

import env from '@/config/env';

const commonOptions: CreateAxiosDefaults = {
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 15000,
};

const baseInstance = axios.create({
    baseURL: env.baseAPI,
    ...commonOptions,
});

const coingeckoInstance = axios.create({
    baseURL: env.coingeckoAPI,
    ...commonOptions,
});

const binanceInstance = axios.create({
    baseURL: env.binanceAPI,
    ...commonOptions,
});

const hyperliquidInstance = axios.create({
    baseURL: env.hyperliquidAPI,
    ...commonOptions,
});

export { binanceInstance, coingeckoInstance, hyperliquidInstance };
export default baseInstance;
