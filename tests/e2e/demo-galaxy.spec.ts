import { test, expect } from '@playwright/test';

test.describe('Demo Galaxy Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the root url
        await page.goto('/');
    });

    test('should load the game canvas', async ({ page }) => {
        // Wait for usage of canvas which implies Phaser is running
        const canvas = page.locator('canvas');
        await expect(canvas).toBeVisible({ timeout: 10000 });
    });

    test('should not have any console errors', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Wait a bit to ensure initialization scripts run
        await page.waitForTimeout(1000);

        expect(consoleErrors).toEqual([]);
    });

    test('should transition to ship-demo-level when astra is clicked', async ({ page }) => {
        // Enable browser logging
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

        // Debug: Log all active scenes every second
        setInterval(async () => {
            // This runs in node context, so we can't easily validly console log from browser
            // We'll rely on page.evaluate
        }, 1000);

        // 1. Wait for the GalaxyScene to be active and the planet 'astra' to exist
        try {
            await page.waitForFunction(() => {
                const game = (window as any).game;
                if (!game) return false;

                const galaxyScene = game.scene.getScene('GalaxyScene');
                if (!galaxyScene) return false;

                const isActive = galaxyScene.sys.settings.active; // Use settings.active or sys.isActive()
                if (!isActive) return false;

                const galaxy = (galaxyScene as any).galaxy;
                return !!galaxy?.getById('astra');
            }, null, { timeout: 40000 });
        } catch (e) {
            // Check what scenes ARE active
            const validScenes = await page.evaluate(() => {
                const game = (window as any).game;
                if (!game) return "No Game Found";
                return game.scene.scenes
                    .filter((s: any) => s.sys.settings.active)
                    .map((s: any) => s.constructor.name);
            });
            console.log('Active scenes at timeout:', validScenes);
            throw e;
        }

        // 2. Get the screen coordinates of the 'astra' planet and its radius for interaction UI calculation
        const planetData = await page.evaluate(() => {
            const game = (window as any).game;
            const scene = game.scene.getScene('GalaxyScene');
            const planet = (scene as any).galaxy.getById('astra');
            if (!planet) throw new Error('Planet astra not found');

            // Replicate calculation from GalaxyInteractionManager
            const basePlanetRadius = 30;
            const planetRadius = basePlanetRadius * (planet.visualScale ?? 1.0);
            const iconY = planet.y + planetRadius + 17;

            // Astra has levelId and warpGalaxyId, so 2 icons.
            const playButtonWorldX = planet.x - 20;
            const playButtonWorldY = iconY;

            const camera = scene.cameras.main;

            return {
                // Convert World Position to Screen Position
                planetX: planet.x - camera.scrollX,
                planetY: planet.y - camera.scrollY,
                playButtonX: playButtonWorldX - camera.scrollX,
                playButtonY: playButtonWorldY - camera.scrollY,
                scrollX: camera.scrollX,
                scrollY: camera.scrollY
            };
        });

        console.log('Planet Data:', planetData);

        // 3. Simulate a user click on the planet to open menu
        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        if (!box) throw new Error('Canvas bounding box not found');

        // Click on the planet
        await page.mouse.click(box.x + planetData.planetX, box.y + planetData.planetY);

        // Wait for potential Intro Overlay
        await page.waitForTimeout(1000);

        // Check if Intro Overlay is visible
        const isIntroVisible = await page.evaluate(() => {
            const game = (window as any).game;
            const scene = game.scene.getScene('GalaxyScene');
            return (scene as any).introOverlay?.visible;
        });

        if (isIntroVisible) {
            console.log('Intro Overlay detected. Dismissing...');
            // Click to skip typing (Click neutral area to avoid hitting planet underneath)
            await page.mouse.click(10, 10);
            await page.waitForTimeout(500);
            // Wait for fade out and HIDDEN state
            await page.waitForFunction(() => {
                const game = (window as any).game;
                const scene = game.scene.getScene('GalaxyScene');
                return !(scene as any).introOverlay?.visible;
            }, null, { timeout: 5000 });
        }

        // 5. Inspect the Play Button Bounds to click accurately
        const btnBounds = await page.evaluate(() => {
            const game = (window as any).game;
            const scene = game.scene.getScene('GalaxyScene');
            const manager = (scene as any).interactions;
            const container = (manager as any).interactionContainer;
            const btn = container.list.find((c: any) => c.text === '🔫');
            if (!btn) return null;

            const bounds = btn.getBounds();
            return {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height
            };
        });

        if (btnBounds) {
            // Click the CENTER of the retrieved bounds
            const clickX = btnBounds.x + btnBounds.width / 2;
            const clickY = btnBounds.y + btnBounds.height / 2;
            await page.mouse.click(clickX, clickY);
        } else {
            // Fallback to calculated position
            await page.mouse.click(box.x + planetData.playButtonX, box.y + planetData.playButtonY);
        }

        // 4. Verify that the scene transitions to 'ShipDemoScene'
        // We wait for the new scene to become active
        await page.waitForFunction(() => {
            const game = (window as any).game;
            // ShipDemoScene key check
            const shipScene = game?.scene.getScene('ShipDemoScene');
            return shipScene && shipScene.sys.isActive();
        }, null, { timeout: 10000 }); // 10s timeout
    });
});
