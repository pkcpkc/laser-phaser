import { test, expect } from '@playwright/test';
import { handleIntro, clickPlanet, startLevel, waitForGalaxy } from '../helpers/galaxy-utils';
import { takeScreenshot } from '../helpers/screenshot-utils';

test.describe('Demo Galaxy Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the demo galaxy directly
        await page.goto('/?galaxyId=demo-galaxy');

        // Wait for game to initialize
        await waitForGalaxy(page, 'demo-galaxy');
    });

    test('should load the game canvas', async ({ page }, testInfo) => {
        // Wait for usage of canvas which implies Phaser is running
        const canvas = page.locator('canvas');
        await expect(canvas).toBeVisible({ timeout: 10000 });
        await takeScreenshot(page, testInfo, '0-canvas-visible.png');
    });

    test('should not have any console errors', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Capture uncaught exceptions
        page.on('pageerror', exception => {
            console.log(`PAGE ERROR: ${exception}`);
            consoleErrors.push(exception.toString());
        });

        // Wait a bit to ensure initialization scripts run
        await page.waitForTimeout(1000);

        expect(consoleErrors).toEqual([]);
    });

    test('should transition to ship-debug-level when ship-debug is clicked', async ({ page }, testInfo) => {
        // Handle Auto-Intro
        await handleIntro(page);

        // 1. Initial screenshot
        await page.waitForTimeout(500);
        await takeScreenshot(page, testInfo, '1-intro-passed.png');

        // 2. Click on the planet ship-debug
        await clickPlanet(page, 'ship-debug');
        await takeScreenshot(page, testInfo, '2-ship-debug-dialog.png');

        // 3. Start Level
        await startLevel(page);
        await takeScreenshot(page, testInfo, '3-level-started.png');
    });
});
