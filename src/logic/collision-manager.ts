import Phaser from 'phaser';
import type { CollisionHandler } from './collision-handlers/collision-handler.interface';
import { WallCollisionHandler } from './collision-handlers/wall-collision-handler';
import { LaserEnemyHandler } from './collision-handlers/laser-enemy-handler';
import { ShipEnemyHandler } from './collision-handlers/ship-enemy-handler';
import { ShipHazardHandler } from './collision-handlers/ship-hazard-handler';
import { ShipLootHandler } from './collision-handlers/ship-loot-handler';

export class CollisionManager {
    private scene: Phaser.Scene;
    private shipCategory: number;
    private laserCategory: number;
    private enemyCategory: number;
    private enemyLaserCategory: number;
    private lootCategory: number;
    private handlers: CollisionHandler[] = [];

    constructor(scene: Phaser.Scene, onGameOver: () => void, onLootCollected?: (loot: Phaser.GameObjects.GameObject) => void) {
        this.scene = scene;

        this.shipCategory = 0x0002;
        this.laserCategory = 0x0004;
        this.enemyCategory = 0x0008;
        this.enemyLaserCategory = 0x0010;
        this.lootCategory = 0x0020;

        console.log('CollisionManager Initialized. Categories:', {
            wall: 0x0001,
            ship: this.shipCategory,
            laser: this.laserCategory,
            enemy: this.enemyCategory,
            enemyLaser: this.enemyLaserCategory,
            loot: this.lootCategory
        });

        // Initialize Handlers
        this.handlers.push(
            new WallCollisionHandler(this.laserCategory, this.enemyLaserCategory),
            new LaserEnemyHandler(this.laserCategory, this.enemyCategory),
            new ShipEnemyHandler(this.shipCategory, this.enemyCategory, onGameOver),
            new ShipHazardHandler(this.shipCategory, this.enemyLaserCategory, onGameOver),
            new ShipLootHandler(this.shipCategory, this.lootCategory, onLootCollected)
        );
    }

    public getCategories() {
        return {
            wallCategory: 0x0001,
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

                const categoryA = bodyA.collisionFilter.category;
                const categoryB = bodyB.collisionFilter.category;

                // Iterate through handlers until one handles the collision
                for (const handler of this.handlers) {
                    if (handler.handle(this.scene, categoryA, categoryB, gameObjectA, gameObjectB)) {
                        break;
                    }
                }
            });
        });
    }
}
