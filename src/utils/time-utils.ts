
export class TimeUtils {
    private static forceE2E: boolean = false;

    /**
     * For testing purposes only. Forces E2E mode behavior.
     */
    static setForceE2EForTesting(value: boolean) {
        this.forceE2E = value;
    }
    /**
     * A wrapper for delayed calls that handles environment-specific timing behavior.
     * 
     * In Production/Standard Dev:
     * Uses Phaser's scene.time.delayedCall. This respects game pause state and time scaling.
     * 
     * In E2E Tests (TEST_E2E=true):
     * Uses window.setTimeout. This bypasses the game loop entirely, preventing timeouts caused by
     * requestAnimationFrame throttling in headless browsers (Playwright).
     * 
     * Safety:
     * When using setTimeout, it includes a check to ensure the scene is still active and not
     * destroyed before executing the callback, preventing "Accessing property of null" crashes.
     * 
     * @param scene The Phaser Scene context
     * @param delay Delay in milliseconds
     * @param callback The function to execute
     * @param args Arguments to pass to the callback
     * @returns The Phaser TimerEvent (in prod) or a numeric ID (in E2E tests) - though usually treated as void
     */
    static delayedCall(scene: Phaser.Scene, delay: number, callback: Function, args?: any[]): Phaser.Time.TimerEvent {
        // Double check we are in the E2E environment (injected via vite define)
        const isE2E = import.meta.env.TEST_E2E;

        if (this.forceE2E || isE2E === true || isE2E === 'true') {
            const id = window.setTimeout(() => {
                // Safety guard: ensure scene is still valid
                if (scene.sys && scene.sys.isActive()) {
                    callback.apply(scene, args || []);
                }
            }, delay);

            // Return a mock TimerEvent that supports cancellation
            return {
                remove: () => window.clearTimeout(id),
                destroy: () => window.clearTimeout(id),
                hasDispatch: false,
                paused: false,
                elapsed: 0,
                delay: delay,
                repeatCount: 0,
                loop: false,
                callback: callback,
                callbackScope: scene,
                args: args || []
            } as unknown as Phaser.Time.TimerEvent;
        }

        return scene.time.delayedCall(delay, callback, args, scene);
    }
}
