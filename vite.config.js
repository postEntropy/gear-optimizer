import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/gear-optimizer/',
    build: {
        outDir: 'build',
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('/recharts/')) return 'charts';
                        if (id.includes('/@mui/')) return 'mui';
                        if (id.includes('react-dnd')) return 'dnd';
                        if (id.includes('/@mui/x-date-pickers/')) return 'date-pickers';
                        if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router')) return 'react';
                        if (id.includes('/redux') || id.includes('redux-saga')) return 'redux';
                        return 'vendor';
                    }
                }
            }
        }
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
