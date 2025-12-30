import Phaser from 'phaser';
import { BaseDrive } from './base-drive';
import { DustTrailEffect } from '../../effects/dust-trail-effect';

/**
 * DustDrive - a passive "drive" for asteroids that produces dust trail particles.
 * Has thrust for movement calculations.
 */
export class DustDrive extends BaseDrive {
    readonly thrust = 1;
    readonly name = 'Dust Trail';
    readonly description = 'Produces a trail of dust particles.';
    readonly TEXTURE_KEY = 'dust-drive-v1';

    private color: number;
    private visualScale: number;

    constructor(color: number = 0x8B7355, visualScale: number = 1) {
        super();
        this.color = color;
        this.visualScale = visualScale;
        this.visibleOnMount = true; // Must be true for addMountEffect to run
    }

    createTexture(scene: Phaser.Scene): void {
        // Create invisible placeholder texture
        if (!scene.textures.exists(this.TEXTURE_KEY)) {
            const graphics = scene.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0x000000, 0); // Fully transparent
            graphics.fillRect(0, 0, 1, 1);
            graphics.generateTexture(this.TEXTURE_KEY, 1, 1);
            graphics.destroy();
        }
    }

    addMountEffect(scene: Phaser.Scene, sprite: Phaser.GameObjects.Image): void {
        // Add dust trail effect
        new DustTrailEffect(scene, sprite, {
            color: this.color,
            scale: this.visualScale,
            frequency: 50 // Increased frequency (lower number)
        });
    }
}
