/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { consoleForwardPlugin } from '@0xbigboss/vite-console-forward-plugin';

const base = '/laser-phaser/';

export default defineConfig(({ command }) => ({
    plugins: [
        // Only use plugin in dev mode (and NOT in E2E tests) to avoid log hijacking
        ...(command === 'serve' && !process.env.TEST_E2E
            ? [
                (() => {
                    const plugin = consoleForwardPlugin();
                    const originalTransform = plugin.transformIndexHtml;
                    // @ts-ignore
                    plugin.transformIndexHtml = (html, ctx) => {
                        // @ts-ignore
                        const result = originalTransform(html, ctx);
                        if (typeof result === 'string') {
                            return result.replace(
                                /\/@id\/__x00__virtual:console-forward/g,
                                `${base}@id/__x00__virtual:console-forward`
                            );
                        }
                        return result;
                    };
                    return plugin;
                })(),
            ]
            : []),
    ],
    server: {
        host: true, // Listen on all local IPs
    },
    base,
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
    define: {
        'import.meta.env.TEST_E2E': process.env.TEST_E2E === 'true' ? 'true' : 'false',
    },
}));
// Trigger restart
