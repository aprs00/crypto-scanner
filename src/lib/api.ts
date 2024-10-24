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

export default baseInstance;
