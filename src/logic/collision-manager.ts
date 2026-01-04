import { injectable, inject } from 'inversify';

import type { ICollisionManager } from '../di/interfaces/logic';
import type { CollisionHandler } from './collision-handlers/collision-handler.interface';
import { WallCollisionHandler } from './collision-handlers/wall-collision-handler';
import { LaserEnemyHandler } from './collision-handlers/laser-enemy-handler';
import { ShipEnemyHandler } from './collision-handlers/ship-enemy-handler';
import { ShipHazardHandler } from './collision-handlers/ship-hazard-handler';
import { ShipLootHandler } from './collision-handlers/ship-loot-handler';

@injectable()
export class CollisionManager implements ICollisionManager {
    private shipCategory: number;
    private laserCategory: number;
    private enemyCategory: number;
    private enemyLaserCategory: number;
    private lootCategory: number;
    private handlers: CollisionHandler[] = [];

    constructor(@inject('Scene') private scene: Phaser.Scene) {
        this.shipCategory = 0x0002;
        this.laserCategory = 0x0004;
        this.enemyCategory = 0x0008;
        this.enemyLaserCategory = 0x0010;
        this.lootCategory = 0x0020;
    }

    public config(onGameOver: () => void, onLootCollected?: (loot: Phaser.GameObjects.GameObject) => void) {
        this.handlers = [];
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
