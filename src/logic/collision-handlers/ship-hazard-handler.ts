import Phaser from 'phaser';
import type { CollisionHandler } from './collision-handler.interface';

export class ShipHazardHandler implements CollisionHandler {
    constructor(
        private shipCategory: number,
        private enemyLaserCategory: number,
        private onGameOver: () => void
    ) { }

    handle(
        scene: Phaser.Scene,
        categoryA: number,
        categoryB: number,
        gameObjectA: Phaser.GameObjects.GameObject | null,
        gameObjectB: Phaser.GameObjects.GameObject | null
    ): boolean {
        if (!gameObjectA || !gameObjectB) return false;

        if ((categoryA === this.shipCategory && categoryB === this.enemyLaserCategory) ||
            (categoryB === this.shipCategory && categoryA === this.enemyLaserCategory)) {

            // Destroy enemy laser
            scene.time.delayedCall(0, () => {
                if (categoryA === this.enemyLaserCategory && gameObjectA.active) gameObjectA.destroy();
                if (categoryB === this.enemyLaserCategory && gameObjectB.active) gameObjectB.destroy();
            });

            this.onGameOver();
            return true;
        }

        return false;
    }
}
