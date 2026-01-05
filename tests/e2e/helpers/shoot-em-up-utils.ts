import type { Page } from '@playwright/test';

/**
 * Forces a level victory via game manager and simulates exit.
 * Handles loot cleanup ensuring reliable exit.
 */
export async function forceVictory(page: Page) {
    console.log('Forcing victory...');
    await page.evaluate(() => {
        const game = (window as any).game;
        const scene = game.scene.getScene('ShootEmUpScene');
        if (scene) {
            // 1. Set victory state
            (scene as any).gameManager.handleVictory((scene as any).planetColor ?? '#ffff00');
        }
    });

    // 2. Wait for victory processing (e.g. loot check)
    await page.waitForTimeout(1000);

    // 3. Trigger exit input directly on the scene to be robust
    console.log('Triggering onGameOverInput directly...');
    await page.evaluate(() => {
        const game = (window as any).game;
        const scene = game.scene.getScene('ShootEmUpScene');
        if (scene) {
            // Force clear any loot to ensure we can exit
            scene.children.list.filter((c: any) => c.constructor.name === 'Loot').forEach((l: any) => l.destroy());
            (scene as any).onGameOverInput();
        }
    });

    // Wait for return to GalaxyScene or WormholeScene
    await page.waitForFunction(() => {
        const game = (window as any).game;
        const galaxyScene = game.scene.getScene('GalaxyScene');
        const wormholeScene = game.scene.getScene('WormholeScene');
        return (galaxyScene && galaxyScene.sys.isActive()) || (wormholeScene && wormholeScene.sys.isActive());
    }, null, { timeout: 20000 });

    console.log('Victory handled, returned to galaxy/wormhole');
}
