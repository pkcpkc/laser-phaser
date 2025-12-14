/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import Terminal from 'vite-plugin-terminal';

export default defineConfig({
    plugins: [
        {
            ...Terminal({
                console: 'terminal',
            }),
            apply: 'serve',
        },
    ],
    base: '/laser-phaser/',
    publicDir: 'public',
    test: {
        environment: 'jsdom',
        globals: true,
    },
    build: {
        outDir: 'docs',
        emptyOutDir: true,
        chunkSizeWarningLimit: 1000, // Phaser is a large library, increase limit to 1000 kB
    },
});
// Trigger restart
