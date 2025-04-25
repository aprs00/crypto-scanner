import env from '@/config/env';
import axios, { type CreateAxiosDefaults } from 'axios';

const commonOptions: CreateAxiosDefaults = {
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 5000,
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

export { binanceInstance, coingeckoInstance };
export default baseInstance;
