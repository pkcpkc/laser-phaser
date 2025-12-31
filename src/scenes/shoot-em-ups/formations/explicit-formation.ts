import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import { BaseFormation } from './base-formation';
import { AsteroidMorphEffect } from '../../../ships/effects/asteroid-morph-effect';


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
        shipConfigs?: ShipConfig[]
    ) {
        super(scene, shipClass, collisionConfig, shipConfigs);
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
            const shipConfig = this.shipConfigs[0];
            const ship = new this.shipClass(this.scene, pos.x, pos.y, shipConfig, this.collisionConfig);

            // Apply Asteroid Morph Effect if applicable
            if (shipConfig && shipConfig.definition.id.includes('asteroid')) {
                const defId = shipConfig.definition.id;
                let radius = 20;
                if (defId.includes('small')) radius = 15; // Approximate radii match AsteroidFieldFormation
                if (defId.includes('medium')) radius = 25;
                if (defId.includes('large')) radius = 40;

                ship.setEffect(new AsteroidMorphEffect(this.scene, ship.sprite, `${defId}-surface`, radius, 5));
            }

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
