import Phaser from 'phaser';
import { Ship } from '../ships/ship';

export class CollisionManager {
    private scene: Phaser.Scene;
    private shipCategory: number;
    private laserCategory: number;
    private enemyCategory: number;
    private enemyLaserCategory: number;
    private onGameOver: () => void;

    constructor(scene: Phaser.Scene, onGameOver: () => void) {
        this.scene = scene;
        this.onGameOver = onGameOver;

        this.shipCategory = this.scene.matter.world.nextCategory();
        this.laserCategory = this.scene.matter.world.nextCategory();
        this.enemyCategory = this.scene.matter.world.nextCategory();
        this.enemyLaserCategory = this.scene.matter.world.nextCategory();
    }

    public getCategories() {
        return {
            shipCategory: this.shipCategory,
            laserCategory: this.laserCategory,
            enemyCategory: this.enemyCategory,
            enemyLaserCategory: this.enemyLaserCategory
        };
    }

    public setupCollisions() {
        this.scene.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
            event.pairs.forEach(pair => {
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                const gameObjectA = bodyA.gameObject as Phaser.GameObjects.GameObject;
                const gameObjectB = bodyB.gameObject as Phaser.GameObjects.GameObject;

                // Laser hitting world bounds
                if ((bodyA.collisionFilter.category === this.laserCategory && !gameObjectB) ||
                    (bodyB.collisionFilter.category === this.laserCategory && !gameObjectA)) {
                    if (gameObjectA) gameObjectA.destroy();
                    if (gameObjectB) gameObjectB.destroy();
                    return;
                }

                if (gameObjectA && gameObjectB) {
                    const categoryA = bodyA.collisionFilter.category;
                    const categoryB = bodyB.collisionFilter.category;

                    // Laser vs Enemy
                    if ((categoryA === this.laserCategory && categoryB === this.enemyCategory) ||
                        (categoryB === this.laserCategory && categoryA === this.enemyCategory)) {

                        const enemyBody = categoryA === this.enemyCategory ? bodyA : bodyB;
                        const enemy = enemyBody.gameObject as Phaser.Physics.Matter.Image;

                        if (enemy) {
                            const ship = enemy.getData('ship') as Ship;
                            if (ship) ship.explode();
                            else {
                                if (categoryA === this.enemyCategory) gameObjectA.destroy();
                                if (categoryB === this.enemyCategory) gameObjectB.destroy();
                            }
                        }

                        if (categoryA === this.laserCategory) gameObjectA.destroy();
                        if (categoryB === this.laserCategory) gameObjectB.destroy();
                    }

                    // Ship vs Enemy
                    if ((categoryA === this.shipCategory && categoryB === this.enemyCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyCategory)) {

                        if (categoryA === this.enemyCategory) {
                            const enemy = gameObjectA as Phaser.Physics.Matter.Image;
                            if (enemy.active) {
                                const ship = enemy.getData('ship') as Ship;
                                if (ship) ship.explode();
                                else gameObjectA.destroy();
                            }
                        }
                        if (categoryB === this.enemyCategory) {
                            const enemy = gameObjectB as Phaser.Physics.Matter.Image;
                            if (enemy.active) {
                                const ship = enemy.getData('ship') as Ship;
                                if (ship) ship.explode();
                                else gameObjectB.destroy();
                            }
                        }

                        this.onGameOver();
                    }

                    // Ship vs Enemy Laser
                    if ((categoryA === this.shipCategory && categoryB === this.enemyLaserCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyLaserCategory)) {

                        // Destroy enemy laser
                        if (categoryA === this.enemyLaserCategory && gameObjectA.active) gameObjectA.destroy();
                        if (categoryB === this.enemyLaserCategory && gameObjectB.active) gameObjectB.destroy();

                        this.onGameOver();
                    }
                }
            });
        });
    }
}
