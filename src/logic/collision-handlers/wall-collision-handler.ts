import Phaser from 'phaser';
import type { CollisionHandler } from './collision-handler.interface';

export class WallCollisionHandler implements CollisionHandler {
    constructor(private laserCategory: number, private enemyLaserCategory: number) { }

    handle(
        _scene: Phaser.Scene,
        categoryA: number,
        categoryB: number,
        gameObjectA: Phaser.GameObjects.GameObject | null,
        gameObjectB: Phaser.GameObjects.GameObject | null
    ): boolean {
        // Laser hitting world bounds (one body has no gameObject)
        const isLaserA = categoryA === this.laserCategory || categoryA === this.enemyLaserCategory;
        const isLaserB = categoryB === this.laserCategory || categoryB === this.enemyLaserCategory;

        if ((isLaserA && !gameObjectB) || (isLaserB && !gameObjectA)) {
            if (gameObjectA) gameObjectA.destroy();
            if (gameObjectB) gameObjectB.destroy();
            return true;
        }

        return false;
    }
}
