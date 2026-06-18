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
        port: 5180,
    },
    esbuild: {
        loader: "jsx",
        include: /src\/.*\.(js|jsx)$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        server: {
            deps: {
                inline: [/@mui\/material/, /@mui\/x-date-pickers/],
            },
        },
    },
});
