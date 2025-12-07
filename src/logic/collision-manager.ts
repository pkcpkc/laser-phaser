import Phaser from 'phaser';
import { Ship } from '../ships/ship';

export class CollisionManager {
    private scene: Phaser.Scene;
    private shipCategory: number;
    private laserCategory: number;
    private enemyCategory: number;
    private enemyLaserCategory: number;
    private lootCategory: number;
    private onGameOver: () => void;
    private onLootCollected?: (loot: Phaser.GameObjects.GameObject) => void;

    constructor(scene: Phaser.Scene, onGameOver: () => void, onLootCollected?: (loot: Phaser.GameObjects.GameObject) => void) {
        this.scene = scene;
        this.onGameOver = onGameOver;
        this.onLootCollected = onLootCollected;

        this.shipCategory = this.scene.matter.world.nextCategory();
        this.laserCategory = this.scene.matter.world.nextCategory();
        this.enemyCategory = this.scene.matter.world.nextCategory();
        this.enemyLaserCategory = this.scene.matter.world.nextCategory();
        this.lootCategory = this.scene.matter.world.nextCategory();

        console.log('CollisionManager Initialized. Categories:', {
            ship: this.shipCategory,
            laser: this.laserCategory,
            enemy: this.enemyCategory,
            enemyLaser: this.enemyLaserCategory,
            loot: this.lootCategory
        });
    }

    public getCategories() {
        return {
            shipCategory: this.shipCategory,
            laserCategory: this.laserCategory,
            enemyCategory: this.enemyCategory,
            enemyLaserCategory: this.enemyLaserCategory,
            lootCategory: this.lootCategory
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
                    if (gameObjectA.constructor.name === 'Loot' || gameObjectB.constructor.name === 'Loot') {
                        console.log('!!! LOOT COLLISION DETECTED !!!');
                        console.log('A:', gameObjectA.constructor.name, bodyA.collisionFilter.category);
                        console.log('B:', gameObjectB.constructor.name, bodyB.collisionFilter.category);
                    }

                    const categoryA = bodyA.collisionFilter.category;
                    const categoryB = bodyB.collisionFilter.category;

                    // console.log(`Collision: ${gameObjectA.constructor.name} (${categoryA}) vs ${gameObjectB.constructor.name} (${categoryB})`);
                    // console.log('Ship Category:', this.shipCategory, 'Loot Category:', this.lootCategory);

                    // Laser vs Enemy
                    if ((categoryA === this.laserCategory && categoryB === this.enemyCategory) ||
                        (categoryB === this.laserCategory && categoryA === this.enemyCategory)) {

                        const enemyBody = categoryA === this.enemyCategory ? bodyA : bodyB;
                        const enemy = enemyBody.gameObject as Phaser.Physics.Matter.Image;

                        if (enemy) {
                            const ship = enemy.getData('ship') as Ship;
                            if (ship) ship.explode();
                            else {
                                this.scene.time.delayedCall(0, () => {
                                    if (categoryA === this.enemyCategory && gameObjectA.active) gameObjectA.destroy();
                                    if (categoryB === this.enemyCategory && gameObjectB.active) gameObjectB.destroy();
                                });
                            }
                        }

                        this.scene.time.delayedCall(0, () => {
                            if (categoryA === this.laserCategory && gameObjectA.active) gameObjectA.destroy();
                            if (categoryB === this.laserCategory && gameObjectB.active) gameObjectB.destroy();
                        });
                    }

                    // Ship vs Enemy
                    if ((categoryA === this.shipCategory && categoryB === this.enemyCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyCategory)) {

                        if (categoryA === this.enemyCategory) {
                            const enemy = gameObjectA as Phaser.Physics.Matter.Image;
                            if (enemy.active) {
                                const ship = enemy.getData('ship') as Ship;
                                if (ship) ship.explode();
                                else {
                                    this.scene.time.delayedCall(0, () => {
                                        if (gameObjectA.active) gameObjectA.destroy();
                                    });
                                }
                            }
                        }
                        if (categoryB === this.enemyCategory) {
                            const enemy = gameObjectB as Phaser.Physics.Matter.Image;
                            if (enemy.active) {
                                const ship = enemy.getData('ship') as Ship;
                                if (ship) ship.explode();
                                else {
                                    this.scene.time.delayedCall(0, () => {
                                        if (gameObjectB.active) gameObjectB.destroy();
                                    });
                                }
                            }
                        }

                        this.onGameOver();
                    }

                    // Ship vs Enemy Laser
                    if ((categoryA === this.shipCategory && categoryB === this.enemyLaserCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.enemyLaserCategory)) {

                        // Destroy enemy laser
                        this.scene.time.delayedCall(0, () => {
                            if (categoryA === this.enemyLaserCategory && gameObjectA.active) gameObjectA.destroy();
                            if (categoryB === this.enemyLaserCategory && gameObjectB.active) gameObjectB.destroy();
                        });

                        this.onGameOver();
                    }

                    // Ship vs Loot
                    if ((categoryA === this.shipCategory && categoryB === this.lootCategory) ||
                        (categoryB === this.shipCategory && categoryA === this.lootCategory)) {

                        const loot = categoryA === this.lootCategory ? gameObjectA : gameObjectB;
                        if (this.onLootCollected) {
                            this.onLootCollected(loot);
                        }
                    }
                }
            });
        });
    }
}
