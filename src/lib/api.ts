import axios from 'axios';

import env from '@/config/env';

const baseInstance = axios.create({
    baseURL: env.baseAPI,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 5000,
});

const coingeckoInstance = axios.create({
    baseURL: env.coingeckoAPI,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 5000,
});

const binanceInstance = axios.create({
    baseURL: env.binanceAPI,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 5000,
});

export {binanceInstance, coingeckoInstance};
export default baseInstance;
