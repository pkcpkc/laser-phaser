import Phaser from 'phaser';
import type { CollisionHandler } from './collision-handler.interface';
import { Ship } from '../../ships/ship';
import { LaserHitEffect } from '../../ships/effects/laser-hit-effect';
import { RocketHitEffect } from '../../ships/effects/rocket-hit-effect';
import type { Projectile } from '../../ships/modules/lasers/projectile';

export class LaserEnemyHandler implements CollisionHandler {
    constructor(private laserCategory: number, private enemyCategory: number) { }

    handle(
        scene: Phaser.Scene,
        categoryA: number,
        categoryB: number,
        gameObjectA: Phaser.GameObjects.GameObject | null,
        gameObjectB: Phaser.GameObjects.GameObject | null
    ): boolean {
        if (!gameObjectA || !gameObjectB) return false;

        if ((categoryA === this.laserCategory && categoryB === this.enemyCategory) ||
            (categoryB === this.laserCategory && categoryA === this.enemyCategory)) {

            const projectile = categoryA === this.laserCategory ? gameObjectA : gameObjectB;
            const projectileImage = projectile as Phaser.Physics.Matter.Image;
            const projectileTyped = projectile as Projectile;

            // Get projectile properties
            const damage = projectileTyped.damage || 10;
            // Use hitColor from projectile if available (defaults to white)
            const color = projectileTyped.hitColor || projectileImage.tintTopLeft || 0xffffff;

            // Rockets have isRocket flag, lasers don't
            if (projectileTyped.isRocket) {
                new RocketHitEffect(scene, projectileImage.x, projectileImage.y, color);
            } else {
                new LaserHitEffect(scene, projectileImage.x, projectileImage.y, color);
            }

            const enemyGO = categoryA === this.enemyCategory ? gameObjectA : gameObjectB;

            // Cast to check for ship data
            const enemy = enemyGO as Phaser.Physics.Matter.Image;

            if (enemy) {
                // All enemies (ships and asteroids) now use Ship class
                const ship = enemy.getData('ship') as Ship;
                if (ship) {
                    // Use damage already extracted above for hit effect
                    ship.takeDamage(damage);
                } else {
                    // Fallback for non-ship enemies (e.g. simple asteroids if any left old style)
                    scene.time.delayedCall(0, () => {
                        if (categoryA === this.enemyCategory && gameObjectA.active) gameObjectA.destroy();
                        if (categoryB === this.enemyCategory && gameObjectB.active) gameObjectB.destroy();
                    });
                }
            }

            // Destroy Laser
            scene.time.delayedCall(0, () => {
                if (categoryA === this.laserCategory && gameObjectA.active) gameObjectA.destroy();
                if (categoryB === this.laserCategory && gameObjectB.active) gameObjectB.destroy();
            });

            return true;
        }

        return false;
    }
}
