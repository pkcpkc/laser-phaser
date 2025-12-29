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

            if (enemy.active) {
                const ship = enemy.getData('ship') as Ship;
                if (ship) {
                    ship.explode();
                } else {
                    scene.time.delayedCall(0, () => {
                        if (enemy.active) enemy.destroy();
                    });
                }
            }

            this.onGameOver();
            return true;
        }

        return false;
    }
}
