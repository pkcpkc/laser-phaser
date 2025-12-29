import Phaser from 'phaser';
import type { CollisionHandler } from './collision-handler.interface';
import { Ship } from '../../ships/ship';

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

            const enemyGO = categoryA === this.enemyCategory ? gameObjectA : gameObjectB;

            // Cast to check for ship data
            const enemy = enemyGO as Phaser.Physics.Matter.Image;

            if (enemy) {
                // All enemies (ships and asteroids) now use Ship class
                const ship = enemy.getData('ship') as Ship;
                if (ship) {
                    ship.explode();
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
