import axios, { type CreateAxiosDefaults } from 'axios';

import env from '@/config/env';
import externalServiceOrigins from '@/config/externalServices';

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
    baseURL: externalServiceOrigins.coingeckoAPI,
    ...commonOptions,
});

const binanceFuturesInstance = axios.create({
    baseURL: externalServiceOrigins.binanceFuturesAPI,
    ...commonOptions,
});

const hyperliquidInstance = axios.create({
    baseURL: externalServiceOrigins.hyperliquidAPI,
    ...commonOptions,
});

const bybitInstance = axios.create({
    baseURL: externalServiceOrigins.bybitAPI,
    ...commonOptions,
});

export { binanceFuturesInstance, bybitInstance, coingeckoInstance, hyperliquidInstance };
export default baseInstance;
