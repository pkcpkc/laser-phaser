/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
    },
    build: {
        chunkSizeWarningLimit: 1000, // Phaser is a large library, increase limit to 1000 kB
    },
});
