/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_API_WS_URL: string;
    readonly VITE_BINANCE_API_URL: string;
    readonly VITE_COINGECKO_API_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
