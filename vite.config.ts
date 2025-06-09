import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.tsx',
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    build: {
        // Reduce resource usage for production builds
        rollupOptions: {
            maxParallelFileOps: 2, // Limit parallel operations
        },
        // Use less memory-intensive minification
        minify: 'esbuild',
        // Reduce chunk size warnings
        chunkSizeWarningLimit: 1000,
        // Disable source maps in production to save memory
        sourcemap: false,
    },
    // Optimize dependencies
    optimizeDeps: {
        exclude: ['@tailwindcss/oxide-linux-x64-gnu'],
    },
    // Reduce memory usage
    esbuild: {
        target: 'es2020',
        // Reduce memory usage during build
        logLimit: 0,
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
