import Phaser from 'phaser';
import type { CollisionHandler } from './collision-handler.interface';
import { Ship } from '../../ships/ship';

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
            // Destroy enemy laser
            const laser = categoryA === this.enemyLaserCategory ? gameObjectA : gameObjectB;
            const damage = (laser as any).damage || 10;

            scene.time.delayedCall(0, () => {
                if (categoryA === this.enemyLaserCategory && gameObjectA.active) gameObjectA.destroy();
                if (categoryB === this.enemyLaserCategory && gameObjectB.active) gameObjectB.destroy();
            });

            // Player takes damage
            const playerGO = categoryA === this.shipCategory ? gameObjectA : gameObjectB;
            if (playerGO && playerGO.active) {
                const playerShip = playerGO.getData('ship') as Ship;
                if (playerShip) {
                    playerShip.takeDamage(damage);

                    if (playerShip.currentHealth <= 0) {
                        this.onGameOver();
                    }
                } else {
                    this.onGameOver(); // Fallback
                }
            }

            return true;
        }

        return false;
    }
}
