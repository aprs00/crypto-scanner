import { createJSONStorage } from 'zustand/middleware';

// localStorage does not exist during SSR / SPA-shell prerender. zustand `persist`
// stores are created at module-eval time, so guard storage access to keep the
// prerender server-safe. On the client this is just window.localStorage.
const noopStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
};

export const safeJSONStorage = () =>
    createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : noopStorage));
