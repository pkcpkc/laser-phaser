import type { Page } from '@playwright/test';

/**
 * Waits for the GalaxyScene to be fully active and verified.
 */
export async function waitForGalaxy(page: Page, galaxyId: string) {
    await page.waitForFunction((gid) => {
        const game = (window as any).game;
        const scene = game?.scene.getScene('GalaxyScene');
        // Check both scene active and correct galaxy ID
        return scene && scene.sys.isActive() && (scene as any).galaxy?.id === gid;
    }, galaxyId, { timeout: 20000 });
}

/**
 * Robust handling of the Intro Overlay.
 * Checks for visibility, skips typing, dismisses, and waits for fade out.
 */
export async function handleIntro(page: Page) {
    // Wait for potential intro to appear
    await page.waitForTimeout(6000);

    // Check if Intro Overlay is visible
    const isIntroVisible = await page.evaluate(() => {
        const game = (window as any).game;
        const scene = game.scene.getScene('GalaxyScene');
        return (scene as any).navigator?.introOverlay?.visible;
    });

    if (isIntroVisible) {
        console.log('Intro visible, starting dismissal sequence...');

        // Get screen center
        const viewport = page.viewportSize();
        const centerX = (viewport?.width || 800) / 2;
        const centerY = (viewport?.height || 600) / 2;

        // 1. Click to skip typing / show full text
        console.log('Clicking to skip typing...');
        await page.mouse.click(centerX, centerY);
        await page.waitForTimeout(1000); // Wait for text to appear fully

        // 2. Click to dismiss
        console.log('Clicking to dismiss...');
        await page.mouse.click(centerX, centerY);

        // Wait for fade out
        console.log('Waiting for fade out...');
        await page.waitForFunction(() => {
            const game = (window as any).game;
            const scene = game.scene.getScene('GalaxyScene');
            const overlay = (scene as any).navigator?.introOverlay;
            return !overlay?.visible || overlay?.alpha === 0;
        }, null, { timeout: 10000 });
        console.log('Intro hidden');
    }
}

/**
 * Opens a planet's interaction menu directly via game logic.
 */
export async function clickPlanet(page: Page, planetId: string) {
    console.log(`Opening menu for planet: ${planetId}`);

    // Wait for planet to exist
    await page.waitForFunction((pid: string) => {
        const game = (window as any).game;
        const scene = game.scene.getScene('GalaxyScene');
        return (scene as any).galaxy?.getById(pid);
    }, planetId, { timeout: 10000 });

    // Force open interaction menu via code to be robust
    await page.evaluate((pid: string) => {
        const game = (window as any).game;
        const scene = game.scene.getScene('GalaxyScene');
        const planet = (scene as any).galaxy.getById(pid);
        (scene as any).interactions.showInteractionUI(planet);
    }, planetId);

    // Wait for UI to open
    await page.waitForTimeout(1000);
}

/**
 * Starts a level by clicking the Play button in the interaction menu.
 */
export async function startLevel(page: Page) {
    console.log('Starting level...');

    // Find Play/Rocket button bounds
    const btnBounds = await page.evaluate(() => {
        const game = (window as any).game;
        const scene = game.scene.getScene('GalaxyScene');
        const manager = (scene as any).interactions;
        const container = (manager as any).interactionContainer;

        if (!container || !container.visible) return null;

        // Look for rocket icon
        const btn = container.list.find((c: any) => c.text === '🚀' || c.text === '▶'); // Fallback check
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

    if (!btnBounds) {
        // Debug what was found
        const items = await page.evaluate(() => {
            const game = (window as any).game;
            const scene = game.scene.getScene('GalaxyScene');
            const manager = (scene as any).interactions;
            const container = (manager as any).interactionContainer;
            if (!container) return 'No Container';
            return container.list.map((c: any) => ({ type: c.type, text: c.text, visible: c.visible }));
        });
        console.log('Interaction Container Items:', items);
        throw new Error('Play button not found');
    }

    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas bounding box not found');

    // Click center of button
    await page.mouse.click(box.x + btnBounds.x + btnBounds.width / 2, box.y + btnBounds.y + btnBounds.height / 2);

    // Wait for ShootEmUpScene to be active
    await page.waitForFunction(() => {
        const game = (window as any).game;
        const scene = game.scene.getScene('ShootEmUpScene');
        return scene && scene.sys.isActive();
    }, null, { timeout: 10000 });

    console.log('Level started');
}
