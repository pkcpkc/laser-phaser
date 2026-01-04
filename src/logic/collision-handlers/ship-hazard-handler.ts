import Phaser from 'phaser';
import type { CollisionHandler } from './collision-handler.interface';
import { Ship } from '../../ships/ship';
import { LaserHitEffect } from '../../ships/effects/laser-hit-effect';
import { RocketHitEffect } from '../../ships/effects/rocket-hit-effect';
import type { Projectile } from '../../ships/modules/lasers/projectile';
import { TimeUtils } from '../../utils/time-utils';

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

            // Get projectile and its properties
            const projectile = categoryA === this.enemyLaserCategory ? gameObjectA : gameObjectB;
            const projectileImage = projectile as Phaser.Physics.Matter.Image;
            const projectileTyped = projectile as Projectile;
            const damage = projectileTyped.damage || 10;
            // Use hitColor from projectile if available
            const color = projectileTyped.hitColor || projectileImage.tintTopLeft || 0xffffff;

            // Rockets have isRocket flag, lasers don't
            if (projectileTyped.isRocket) {
                new RocketHitEffect(scene, projectileImage.x, projectileImage.y, color);
            } else {
                new LaserHitEffect(scene, projectileImage.x, projectileImage.y, color);
            }

            // Destroy enemy laser
            TimeUtils.delayedCall(scene, 0, () => {
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
