import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import { BaseFormation } from './base-formation';
import { AsteroidMorphEffect } from '../../../ships/effects/asteroid-morph-effect';
import { generateSmallAsteroidTexture, generateAsteroidSurfaceTexture } from '../../../ships/definitions/asteroid-small';
import { generateMediumAsteroidTexture } from '../../../ships/definitions/asteroid-medium';
import { generateLargeAsteroidTexture } from '../../../ships/definitions/asteroid-large';

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

        // Check if we need to generate asteroid textures
        if (this.shipConfig && this.shipConfig.definition.id.includes('asteroid')) {
            this.ensureAsteroidTextures();
        }

        for (const pos of positions) {
            const ship = new this.shipClass(this.scene, pos.x, pos.y, this.shipConfig!, this.collisionConfig);

            // Apply Asteroid Morph Effect if applicable
            if (this.shipConfig && this.shipConfig.definition.id.includes('asteroid')) {
                const defId = this.shipConfig.definition.id;
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

    private ensureAsteroidTextures() {
        // Simple check to avoid regeneration if possible, though generator functions usually check existence
        // We reuse the generator logic from AsteroidFieldFormation logic roughly
        // Ideally checking for one key existence is enough
        if (this.scene.textures.exists('asteroid-small-surface-0')) return;

        // Determine which specific asteroid type we are, or just generate all?
        // Safer to generate specific ones related to this shipConfig
        const defId = this.shipConfig?.definition.id || '';

        if (defId.includes('small')) {
            generateSmallAsteroidTexture(this.scene);
            for (let i = 0; i < 5; i++) {
                generateAsteroidSurfaceTexture(this.scene, `asteroid-small-surface-${i}`, 40, {
                    fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
                });
            }
        }
        if (defId.includes('medium')) {
            generateMediumAsteroidTexture(this.scene);
            for (let i = 0; i < 5; i++) {
                generateAsteroidSurfaceTexture(this.scene, `asteroid-medium-surface-${i}`, 60, {
                    fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
                });
            }
        }
        if (defId.includes('large')) {
            generateLargeAsteroidTexture(this.scene);
            for (let i = 0; i < 5; i++) {
                generateAsteroidSurfaceTexture(this.scene, `asteroid-large-surface-${i}`, 90, {
                    fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
                });
            }
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
