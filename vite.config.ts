import tailwindcss from '@tailwindcss/vite';
import {TanStackRouterVite} from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react-swc';
import * as path from 'path';
import {defineConfig} from 'vite';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), svgr(), TanStackRouterVite(), tailwindcss()],
    resolve: {
        alias: [{find: '@', replacement: path.resolve(__dirname, 'src')}],
    },
});
