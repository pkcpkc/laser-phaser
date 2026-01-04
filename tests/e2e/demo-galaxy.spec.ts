import { test, expect } from '@playwright/test';

test.describe('Demo Galaxy Smoke Test', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the demo galaxy directly
        await page.goto('/?galaxyId=demo-galaxy');
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

        // Capture uncaught exceptions
        page.on('pageerror', exception => {
            console.log(`PAGE ERROR: ${exception}`);
            consoleErrors.push(exception.toString());
        });

        // Wait a bit to ensure initialization scripts run
        await page.waitForTimeout(1000);

        expect(consoleErrors).toEqual([]);
    });

    test('should transition to ship-demo-level when astra is clicked', async ({ page }) => {
        // Enable browser logging
        page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
        page.on('pageerror', exception => console.log('PAGE ERROR:', exception));

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

        // 3. Handle Auto-Intro (waits for 1.5s delay + animation)
        // Game might be slow, so wait longer (6000ms)
        await page.waitForTimeout(6000);

        // Check if Intro Overlay is visible
        const isIntroVisible = await page.evaluate(() => {
            const game = (window as any).game;
            const scene = game.scene.getScene('GalaxyScene');
            // IntroOverlay is in navigator
            return (scene as any).navigator?.introOverlay?.visible;
        });

        console.log('Is Intro Visible:', isIntroVisible);

        if (isIntroVisible) {
            // Click to skip typing
            await page.mouse.click(10, 10);
            await page.waitForTimeout(500);
            // Click to hide
            await page.mouse.click(10, 10);

            // Wait for fade out and HIDDEN state
            await page.waitForFunction(() => {
                const game = (window as any).game;
                const scene = game.scene.getScene('GalaxyScene');
                return !(scene as any).navigator?.introOverlay?.visible;
            }, null, { timeout: 5000 });
            console.log('Intro Hidden');
        }

        // 4. Click on the planet to open menu
        // Need to re-query bounding box as window might have shifted or resized slightly? Unlikely inside test.
        // But safe to just use previous logic.
        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        if (!box) throw new Error('Canvas bounding box not found');

        console.log(`Clicking Planet at ${box.x + planetData.planetX}, ${box.y + planetData.planetY}`);
        await page.mouse.click(box.x + planetData.planetX, box.y + planetData.planetY);
        await page.waitForTimeout(1000); // Wait for UI to open (Increased to 1s)

        // 5. Inspect the Play Button Bounds to click accurately
        const btnBounds = await page.evaluate(() => {
            const game = (window as any).game;
            const scene = game.scene.getScene('GalaxyScene');
            const manager = (scene as any).interactions;
            const container = (manager as any).interactionContainer;

            if (!container) return { error: 'No Interaction Container' };
            if (!container.visible) return { error: 'Container Not Visible', alpha: container.alpha };
            if (container.list.length === 0) return { error: 'Container Empty' };

            // Debug: Log items
            const items = container.list.map((c: any) => ({ type: c.type, text: c.text }));
            // console.log('Container Items:', items); // To browser console

            const btn = container.list.find((c: any) => c.text === '🚀');
            if (!btn) return { error: 'Button 🚀 Not Found', items };

            const bounds = btn.getBounds();
            const camera = scene.cameras.main;

            return {
                x: bounds.x - camera.scrollX,
                y: bounds.y - camera.scrollY,
                width: bounds.width,
                height: bounds.height
            };
        });

        if (btnBounds && !('error' in btnBounds)) {
            console.log('Found Play Button at:', btnBounds);
            // Click the CENTER of the retrieved bounds
            const clickX = btnBounds.x + btnBounds.width / 2;
            const clickY = btnBounds.y + btnBounds.height / 2;
            await page.mouse.click(box.x + clickX, box.y + clickY);
        } else {
            console.log('Using Fallback Click Position. Reason:', btnBounds);
            // Fallback to calculated position
            await page.mouse.click(box.x + planetData.playButtonX, box.y + planetData.playButtonY);
        }

        // 4. Verify that the scene transitions to 'ShootEmUpScene'
        // We wait for the new scene to become active
        // INCREASED TIMEOUT to 15s
        await page.waitForFunction(() => {
            const game = (window as any).game;
            // ShootEmUpScene key check
            const shipScene = game?.scene.getScene('ShootEmUpScene');
            return shipScene && shipScene.sys.isActive();
        }, null, { timeout: 15000 });
    });
});
