import Phaser from 'phaser';
import type { CollisionHandler } from './collision-handler.interface';
import { Ship } from '../../ships/ship';
import { TimeUtils } from '../../utils/time-utils';

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

            let ship: Ship | undefined;
            if (enemy.active) {
                ship = enemy.getData('ship') as Ship;
            }

            // Calculate damage to player FIRST (before enemy takes damage)
            // Use Math.max(0, ...) to ensure we don't heal the player if enemy is already destroyed/negative
            const playerDamageFromEnemy = ship ? Math.max(0, ship.currentHealth) * 3 : 30;

            // Enemy takes damage
            if (ship) {
                ship.takeDamage(100); // Massive ramming damage to enemy
            } else {
                TimeUtils.delayedCall(scene, 0, () => {
                    if (enemy.active) enemy.destroy();
                });
            }

            // Player takes damage
            const playerGO = categoryA === this.shipCategory ? gameObjectA : gameObjectB;
            if (playerGO && playerGO.active) {
                const playerShip = playerGO.getData('ship') as Ship;
                if (playerShip) {
                    playerShip.takeDamage(playerDamageFromEnemy); // Ramming damage based on enemy health * 3

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
