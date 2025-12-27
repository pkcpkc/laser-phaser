import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import { BaseFormation } from './base-formation';

export interface ExplicitFormationConfig {
    positions?: { x: number; y: number }[];
    shootingChance?: number;
    shotsPerEnemy?: number;
    shotDelay?: { min: number; max: number };
    continuousFire?: boolean;
}

export class ExplicitFormation extends BaseFormation {
    private config: ExplicitFormationConfig;

    constructor(
        scene: Phaser.Scene,
        shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        collisionConfig: ShipCollisionConfig,
        config?: ExplicitFormationConfig,
        shipConfig?: ShipConfig
    ) {
        super(scene, shipClass, collisionConfig, shipConfig);
        this.config = {
            positions: [],
            shootingChance: 0.5,
            shotsPerEnemy: 1,
            shotDelay: { min: 1000, max: 3000 },
            ...config
        };
    }

    spawn(): void {
        const positions = this.config.positions || [];

        for (const pos of positions) {
            const ship = new this.shipClass(this.scene, pos.x, pos.y, this.shipConfig!, this.collisionConfig);
            const enemy = ship.sprite;

            // Store initial data for Tactics
            this.enemies.push({
                ship: ship,
                spawnTime: this.scene.time.now,
                startX: pos.x,
                startY: pos.y
            });

            // Schedule shooting
            this.scheduleShootingBehavior(ship, enemy, {
                shootingChance: this.config.shootingChance!,
                shotsPerEnemy: this.config.shotsPerEnemy!,
                shotDelay: this.config.shotDelay!,
                continuousFire: this.config.continuousFire
            });
        }
    }

    update(_time: number, _delta?: number): void {
        // Just cleanup of destroyed enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemyData = this.enemies[i];
            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) {
                this.enemies.splice(i, 1);
            }
        }
    }
}
