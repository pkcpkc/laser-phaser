import Phaser from 'phaser';
import { BaseLaser } from '../lasers/base-laser';

export abstract class BaseRocket extends BaseLaser {
    abstract readonly maxAmmo: number;
    readonly visibleOnMount = true;
    currentAmmo: number | undefined;

    constructor() {
        super();
        // this.currentAmmo will be lazy loaded
    }

    // Override fire to handle ammo
    override fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number
    ): Phaser.Physics.Matter.Image | undefined {
        // Initialize ammo if not set (or could be done in constructor if we passed maxAmmo there, but abstract properties are tricky with constructors)
        // A cleaner way is to just assume currentAmmo is synced with maxAmmo initially.
        // But since maxAmmo is abstract and read-only, we can't access it easily in the constructor of the base class.
        // Let's use a lazy init approach or just force subclasses to handle init if they want specialized start.
        // For simplicity, let's reset ammo to max if it's 0 (first run logic ish)
        // Actually, we want persistent ammo maybe?
        // For now, let's just initialize it to maxAmmo if it's undefined (simulated by checking if it's 0 and we haven't fired yet? No.)

        // Let's just initialize currentAmmo to maxAmmo. We can't do it in constructor because maxAmmo isn't available yet in super().
        // We'll check if it's the first fire or if we need a reset method?
        // Let's check if undefined (if we made it optional) or just assume valid state.
        // Let's just set it to maxAmmo in the subclass constructor OR just check here.

        if (this.currentAmmo === undefined) {
            this.currentAmmo = this.maxAmmo;
        }

        if (this.currentAmmo <= 0) {
            // Out of ammo
            // Maybe play a click sound?
            return undefined;
        }

        this.currentAmmo--;
        // console.log(`Ammo: ${this.currentAmmo}/${this.maxAmmo}`);

        return super.fire(scene, x, y, angle, category, collidesWith);
    }

    // Helper to reload
    reload() {
        this.currentAmmo = this.maxAmmo;
    }
}
