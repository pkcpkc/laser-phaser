/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import Terminal from 'vite-plugin-terminal';

export default defineConfig(({ command }) => ({
    plugins: [
        // Only use Terminal plugin in dev mode (and NOT in E2E tests) to avoid log hijacking
        // command === 'serve' means dev server.
        // We also check !process.env.TEST_E2E to ensure we don't load it during Playwright runs
        ...(command === 'serve' && !process.env.TEST_E2E ? [Terminal({
            console: 'terminal',
        })] : []),
    ],
    server: {
        host: true, // Listen on all local IPs
    },
    base: '/laser-phaser/',
    publicDir: 'public',
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['tests/unit/**/*.{test,spec}.ts'],
    },
    build: {
        outDir: 'docs',
        emptyOutDir: true,
        chunkSizeWarningLimit: 1000, // Phaser is a large library, increase limit to 1000 kB
    },
}));
// Trigger restart
