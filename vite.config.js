import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/gear-optimizer/',
    build: {
        outDir: 'build',
    },
    server: {
        open: true,
    },
    esbuild: {
        loader: "jsx",
        include: /src\/.*\.js$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
});
