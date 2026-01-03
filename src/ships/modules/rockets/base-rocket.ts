import Phaser from 'phaser';
import { BaseLaser } from '../lasers/base-laser';
import { Projectile } from '../lasers/projectile';

export abstract class BaseRocket extends BaseLaser {
    abstract readonly maxAmmo: number;
    readonly visibleOnMount = true;

    constructor() {
        super();
        // this.currentAmmo will be lazy loaded
    }

    // Override fire to handle ammo and mark as rocket
    override fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number,
        shipVelocity?: { x: number; y: number }
    ): Phaser.Physics.Matter.Image | undefined {
        if (this.currentAmmo === undefined) {
            this.currentAmmo = this.maxAmmo;
        }

        if (this.currentAmmo <= 0) {
            return undefined;
        }

        this.currentAmmo--;

        // Call parent fire (this sets hitColor from COLOR)
        const projectile = super.fire(scene, x, y, angle, category, collidesWith, shipVelocity);

        // Mark as rocket for explosive hit effect
        if (projectile && projectile instanceof Projectile) {
            projectile.isRocket = true;
        }

        return projectile;
    }

    // Helper to reload
    reload() {
        this.currentAmmo = this.maxAmmo;
    }
}
