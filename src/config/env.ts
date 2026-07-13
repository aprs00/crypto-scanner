const { VITE_API_URL, VITE_API_WS_URL } = import.meta.env;

const env = {
    baseAPI: VITE_API_URL,
    baseWS: VITE_API_WS_URL,
} as const;

export default env;
