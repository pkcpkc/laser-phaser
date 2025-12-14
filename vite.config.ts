/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import Terminal from 'vite-plugin-terminal';

export default defineConfig(({ command }) => ({
    plugins: [
        // Only use Terminal plugin in dev mode to avoid build errors
        ...(command === 'serve' ? [Terminal({
            console: 'terminal',
        })] : []),
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
}));
// Trigger restart
