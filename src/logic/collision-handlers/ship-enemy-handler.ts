import Phaser from 'phaser';
import type { CollisionHandler } from './collision-handler.interface';
import { Ship } from '../../ships/ship';

export class ShipEnemyHandler implements CollisionHandler {
    constructor(
        private shipCategory: number,
        private enemyCategory: number,
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

        if ((categoryA === this.shipCategory && categoryB === this.enemyCategory) ||
            (categoryB === this.shipCategory && categoryA === this.enemyCategory)) {

            const enemyGO = categoryA === this.enemyCategory ? gameObjectA : gameObjectB;
            const enemy = enemyGO as Phaser.Physics.Matter.Image;

            // Enemy takes damage
            if (enemy.active) {
                const ship = enemy.getData('ship') as Ship;
                if (ship) {
                    ship.takeDamage(100); // Massive ramming damage to enemy
                } else {
                    scene.time.delayedCall(0, () => {
                        if (enemy.active) enemy.destroy();
                    });
                }
            }

            // Player takes damage
            const playerGO = categoryA === this.shipCategory ? gameObjectA : gameObjectB;
            if (playerGO && playerGO.active) {
                const playerShip = playerGO.getData('ship') as Ship;
                if (playerShip) {
                    playerShip.takeDamage(50); // Ramming damage to player

                    if (playerShip.currentHealth <= 0) {
                        this.onGameOver();
                    }
                } else {
                    // Should not happen for player ship, but fallback
                    this.onGameOver();
                }
            }

            return true;
        }

        return false;
    }
}
