import Phaser from 'phaser';
import { BaseLaser } from './base-laser';

export class BigRedLaser extends BaseLaser {
    readonly TEXTURE_KEY = 'big-red-laser';
    readonly COLOR = 0xff0000;
    readonly SPEED = 5;
    readonly width = 4;
    readonly height = 4;
    readonly reloadTime = 600; // Slow but powerful
    readonly firingDelay = { min: 500, max: 800 };

    override fire(
        scene: Phaser.Scene,
        x: number,
        y: number,
        angle: number,
        category: number,
        collidesWith: number,
        shipVelocity?: { x: number; y: number }
    ) {
        const delay = Phaser.Math.Between(0, 100);

        if (delay === 0) {
            return super.fire(scene, x, y, angle, category, collidesWith, shipVelocity);
        }

        scene.time.delayedCall(delay, () => {
            super.fire(scene, x, y, angle, category, collidesWith, shipVelocity);
        });

        return {} as Phaser.Physics.Matter.Image;
    }
}
