import { test } from '@playwright/test';
import { handleIntro, clickPlanet, startLevel, waitForGalaxy } from '../helpers/galaxy-utils';
import { forceVictory } from '../helpers/shoot-em-up-utils';
import { takeScreenshot } from '../helpers/screenshot-utils';

test.describe('Blood Hunter Galaxy E2E', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        // Start in Blood Hunters Galaxy with collisions disabled
        await page.goto('/?galaxyId=blood-hunters-galaxy&collision=false');

        // Wait for game to initialize
        await page.waitForFunction(() => {
            const game = (window as any).game;
            return game && game.scene.getScene('GalaxyScene') && game.scene.getScene('GalaxyScene').sys.isActive();
        }, null, { timeout: 20000 });

        // Handle Intro Overlay using helper
        await handleIntro(page);
    });

    test('travel belt-vortex-halo and warp', async ({ page }, testInfo) => {
        // 1. Initial screenshot - wait for intro to be gone completely
        await page.waitForTimeout(500);
        await takeScreenshot(page, testInfo, '0-galaxy-blood-hunters.png');

        // 2. Travel to Belt
        await clickPlanet(page, 'belt');
        await takeScreenshot(page, testInfo, '1-belt-dialog.png');

        // 3. Play Belt Level
        await startLevel(page);
        await page.waitForTimeout(2000); // Let level run a bit
        await takeScreenshot(page, testInfo, '2-belt-level.png');
        await forceVictory(page);

        // Verify back in Galaxy
        await page.waitForTimeout(1000); // Animation settle

        // 4. Travel to Vortex
        await clickPlanet(page, 'vortex');
        await takeScreenshot(page, testInfo, '3-vortex-dialog.png');

        // 5. Play Vortex Level
        await startLevel(page);
        await page.waitForTimeout(2000);
        await takeScreenshot(page, testInfo, '4-vortex-level.png');
        await forceVictory(page);

        await page.waitForTimeout(1000);

        // 6. Travel to Halo
        await clickPlanet(page, 'halo');
        await takeScreenshot(page, testInfo, '5-halo-dialog.png');

        // 7. Play Halo Level (triggers Warp on victory)
        await startLevel(page);
        await page.waitForTimeout(2000);
        await takeScreenshot(page, testInfo, '6-halo-level.png');

        // Force victory - this should trigger the warp because of the config
        // interaction: { levelId: 'blood-boss-level', warpGalaxyId: 'demo-galaxy' }
        await forceVictory(page);

        // 8. Verify Warp to Final Galaxy
        console.log('Waiting for arrival at Demo Galaxy...');
        await waitForGalaxy(page, 'demo-galaxy');

        await page.waitForTimeout(1000); // Wait for fade in
        await takeScreenshot(page, testInfo, '8-galaxy-demo.png');
    });
});
