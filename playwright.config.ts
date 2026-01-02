import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [['html', { outputFolder: 'tests/reports/playwright-report' }]],
    outputDir: 'tests/reports/test-results',
    use: {
        baseURL: 'http://localhost:5177', // Use distinct port for E2E
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'TEST_E2E=true npm run dev -- --port 5177',
        url: 'http://localhost:5177',
        reuseExistingServer: false, // Force new server with correct env vars
    },
});
