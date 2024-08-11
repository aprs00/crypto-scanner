const {VITE_API_URL, VITE_API_WS_URL, VITE_BINANCE_API_URL, VITE_COINGECKO_API_URL} = import.meta.env;

const env = {
    baseAPI: VITE_API_URL,
    baseWS: VITE_API_WS_URL,
    binanceAPI: VITE_BINANCE_API_URL,
    coingeckoAPI: VITE_COINGECKO_API_URL,
} as const;

export default env;
