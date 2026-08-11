import { test, expect } from '@playwright/test';
import { handleIntro, clickPlanet, waitForGalaxy } from '../helpers/galaxy-utils';
import { takeScreenshot } from '../helpers/screenshot-utils';

test.describe('Shipyard E2E Test', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the demo galaxy directly
        await page.goto('/?galaxyId=demo-galaxy');

        // Wait for game to initialize
        await waitForGalaxy(page, 'demo-galaxy');
    });

    test('should transition to ShipyardScene and load the ship preview', async ({ page }, testInfo) => {
        // Handle Auto-Intro
        await handleIntro(page);

        // Click on planet 'astra' which has a shipyard configured
        await clickPlanet(page, 'astra');
        await takeScreenshot(page, testInfo, 'astra-interaction-opened.png');

        // Find the shipyard (wrench) button bounds
        const btnBounds = await page.evaluate(() => {
            const game = (window as any).game;
            const scene = game.scene.getScene('GalaxyScene');
            const manager = (scene as any).interactions;
            const container = (manager as any).interactionContainer;

            if (!container || !container.visible) return null;

            // Look for shipyard icon 🛠️
            const btn = container.list.find((c: any) => c.text === '🛠️');
            if (!btn) return null;

            const bounds = btn.getBounds();
            const camera = scene.cameras.main;

            return {
                x: bounds.x - camera.scrollX,
                y: bounds.y - camera.scrollY,
                width: bounds.width,
                height: bounds.height
            };
        });

        expect(btnBounds).not.toBeNull();

        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        if (!box) throw new Error('Canvas bounding box not found');

        // Click center of shipyard button
        await page.mouse.click(
            box.x + btnBounds!.x + btnBounds!.width / 2, 
            box.y + btnBounds!.y + btnBounds!.height / 2
        );

        // Wait for ShipyardScene to be active
        await page.waitForFunction(() => {
            const game = (window as any).game;
            const scene = game.scene.getScene('ShipyardScene');
            return scene && scene.sys.isActive();
        }, null, { timeout: 15000 });

        // Let the scene render for a second
        await page.waitForTimeout(1000);
        await takeScreenshot(page, testInfo, 'shipyard-redesign-loaded.png');

        const isShipyardSceneActive = await page.evaluate(() => {
            const game = (window as any).game;
            const scene = game.scene.getScene('ShipyardScene');
            return scene && scene.sys.isActive();
        });
        expect(isShipyardSceneActive).toBe(true);
    });
});
