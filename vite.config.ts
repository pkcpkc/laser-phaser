/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { consoleForwardPlugin } from '@0xbigboss/vite-console-forward-plugin';

export default defineConfig(({ command }) => ({
    plugins: [
        // Only use plugin in dev mode (and NOT in E2E tests) to avoid log hijacking
        ...(command === 'serve' && !process.env.TEST_E2E ? [consoleForwardPlugin()] : []),
    ],
    server: {
        host: true, // Listen on all local IPs
    },
    base: '/laser-phaser/',
    publicDir: 'public',
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['tests/unit/**/*.{test,spec}.ts', 'tests/integration/**/*.{test,spec}.ts'],
        setupFiles: ['./tests/setup.ts'],
    },
    build: {
        outDir: 'docs',
        emptyOutDir: true,
        chunkSizeWarningLimit: 1000, // Phaser is a large library, increase limit to 1000 kB
    },
}));
// Trigger restart
