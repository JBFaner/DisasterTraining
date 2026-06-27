import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    // Override Laravel Vite's default "@": "/resources/js" — on Windows that resolves to the drive root (e.g. C:\resources\js)
    // and breaks @/ imports in JS/JSX modules.
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx', 'resources/js/auth.jsx'],
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    server: {
        host: '127.0.0.1',
        port: 5177,
        strictPort: true,
        hmr: {
            host: '127.0.0.1',
            port: 5177,
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
