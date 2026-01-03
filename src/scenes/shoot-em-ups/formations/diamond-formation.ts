import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import { BaseFormation } from './base-formation';

// Movement & Spawning Constants
const SPAWN_Y = -200;
const WOBBLE_SPEED_BASE = 0.8;
const WOBBLE_SPEED_RANGE = 0.4;
const WOBBLE_TIME_SCALE = 0.001;
const WOBBLE_X_MULTIPLIER = 2;
const WOBBLE_Y_MULTIPLIER = 1.5;
const WOBBLE_Y_SCALE = 0.3;
// Bounds buffer is handled by Tactic or generic check? 
// Ideally Tactic handles global bounds, but Formation might want self-cleanup.
const BOUNDS_BUFFER = 200;

export interface DiamondFormationConfig {
    spacing?: number;
    verticalSpacing?: number;
    startWidthPercentage: number;
    endWidthPercentage: number;
    shotsPerEnemy?: number;
    shotDelay?: { min: number; max: number };
    continuousFire?: boolean;
    movementVariation?: number; // Wobble magnitude
    formationGrid: number[];
    // We can also accept an angle to pre-rotate the formation alignment?
    rotation?: number;
}

export interface DiamondEnemyData {
    ship: Ship;
    spawnTime: number;
    startX: number;
    startY: number;
    // Wobble state
    wobbleOffset: number;
    wobbleSpeed: number;
}

export class DiamondFormation extends BaseFormation {
    private config: Required<Pick<DiamondFormationConfig, 'spacing' | 'verticalSpacing' | 'startWidthPercentage' | 'shotsPerEnemy' | 'shotDelay' | 'continuousFire' | 'movementVariation' | 'formationGrid' | 'rotation'>>;
    // @ts-ignore
    protected enemies: DiamondEnemyData[] = [];

    constructor(
        scene: Phaser.Scene,
        shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        collisionConfig: ShipCollisionConfig,
        config?: DiamondFormationConfig,
        shipConfigs?: ShipConfig[]
    ) {
        super(scene, shipClass, collisionConfig, shipConfigs);

        const defaultRotation = (() => {
            if (config?.rotation !== undefined) return config.rotation;

            // Auto-calculate
            const startPct = config?.startWidthPercentage ?? 0.5;
            const endPct = config?.endWidthPercentage ?? 0.5;
            const width = scene.scale.width;
            const startX = width * startPct;
            const endX = width * endPct;
            const dx = endX - startX;
            // Same assumption as LinearTactic: dy = height + 400
            const dy = scene.scale.height + 400;
            const angle = Math.atan2(dy, dx);
            return angle - Math.PI / 2;
        })();

        this.config = {
            spacing: 80,
            verticalSpacing: 60,
            startWidthPercentage: config?.startWidthPercentage ?? 0.5,
            endWidthPercentage: config?.endWidthPercentage ?? 0.5,
            shotsPerEnemy: 1,
            shotDelay: { min: 1000, max: 3000 },
            continuousFire: false,
            movementVariation: 10,
            formationGrid: config?.formationGrid || [1, 2, 3],
            rotation: defaultRotation,
            ...config
        };
    }

    spawn(): void {
        const { width } = this.scene.scale;
        const startCenterX = width * this.config.startWidthPercentage;

        // Alignment Rotation
        const rotationAngle = this.config.rotation;


        const rows = this.config.formationGrid.map((count, index) => ({
            count: count,
            depth: index * this.config.verticalSpacing
        }));

        let totalSpawned = 0;

        for (const row of rows) {
            for (let i = 0; i < row.count; i++) {
                // Local position in formation space
                const localX = (i - (row.count - 1) / 2) * this.config.spacing;
                const localY = -row.depth;

                // Rotate formation shape
                const cos = Math.cos(rotationAngle);
                const sin = Math.sin(rotationAngle);
                const rotatedX = localX * cos - localY * sin;
                const rotatedY = localX * sin + localY * cos;

                const x = startCenterX + rotatedX;
                const y = SPAWN_Y + rotatedY;

                // Cycle through ship configs
                const configIndex = totalSpawned % this.shipConfigs.length;
                const shipConfig = this.shipConfigs[configIndex];

                const ship = new this.shipClass(this.scene, x, y, shipConfig, this.collisionConfig);
                totalSpawned++;
                const enemy = ship.sprite;
                enemy.setData('ship', ship);

                this.enemies.push({
                    ship: ship,
                    spawnTime: this.scene.time.now,
                    startX: x,
                    startY: y,
                    wobbleOffset: Math.random() * Math.PI * 2,
                    wobbleSpeed: WOBBLE_SPEED_BASE + Math.random() * WOBBLE_SPEED_RANGE
                });

                this.scheduleShootingBehavior(ship, enemy, {
                    shotsPerEnemy: this.config.shotsPerEnemy,
                    shotDelay: this.config.shotDelay,
                    continuousFire: this.config.continuousFire
                });
            }
        }
    }

    update(time: number): void {
        const { height } = this.scene.scale;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemyData = this.enemies[i];

            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            const enemy = enemyData.ship.sprite;

            // Apply Wobble
            // Note: Tactic sets the "Base" position (x, y).
            // If Tactic.update() runs BEFORE Formation.update(), enemy.x/y is at the path position.
            // We just add the wobble offset to the current position.

            // CAUTION: If we blindly add wobble to current position `x += wobble`, it accumulates!
            // We need to calculate the wobble offset and apply it *relative to the path*.
            // But we don't know the path position here easily unless we stored it or Tactic is "Base".

            // Assumption: Tactic sets `enemy.setPosition(pathX, pathY)`.
            // Formation applies `enemy.setPosition(pathX + wobbleX, pathY + wobbleY)`.

            // So we take current pos (which is path pos if Tactic ran first) and add offset?
            // Yes, assuming Tactic runs first in the same frame.

            const wobbleTime = time * WOBBLE_TIME_SCALE * enemyData.wobbleSpeed + enemyData.wobbleOffset;
            const wobbleX = Math.sin(wobbleTime * WOBBLE_X_MULTIPLIER) * this.config.movementVariation;
            const wobbleY = Math.cos(wobbleTime * WOBBLE_Y_MULTIPLIER) * (this.config.movementVariation * WOBBLE_Y_SCALE);

            enemy.x += wobbleX;
            enemy.y += wobbleY;

            // Cleanup checks
            if (enemy.y > height + BOUNDS_BUFFER || enemy.x < -BOUNDS_BUFFER || enemy.x > this.scene.scale.width + BOUNDS_BUFFER) {
                enemyData.ship.destroy();
                this.enemies.splice(i, 1);
            }
        }
    }
}


