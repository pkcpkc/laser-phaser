import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import { BaseFormation, type BaseEnemyData, type ShootingConfig } from './base-formation';
import type { ShipConfig } from '../../../ships/types';

export interface FixedFormationConfig extends ShootingConfig {
    // Array of positions relative to screen or absolute
    // For now, let's assume absolute or relative to center?
    // Let's make it simple: explicit (x, y) coordinates for each ship instance
    positions: { x: number; y: number }[];
    spawnDelay?: number;
    // Oscillation config
    oscillate?: boolean;
    oscillateDistance?: number; // How far to move forward/back (default 50)
    oscillateSpeed?: number;    // Speed of oscillation (default 0.002)
}

interface FixedEnemyData extends BaseEnemyData {
    startX: number; // Store initial X position
    startY: number; // Store initial Y position for oscillation
}

export class FixedFormation extends BaseFormation {
    private config: FixedFormationConfig;
    protected enemies: FixedEnemyData[] = [];

    constructor(
        scene: Phaser.Scene,
        shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        collisionConfig: ShipCollisionConfig,
        config?: Partial<FixedFormationConfig>,
        shipConfigs?: ShipConfig[]
    ) {
        super(scene, shipClass, collisionConfig, shipConfigs);
        this.config = {
            positions: config?.positions ?? [],
            shotsPerEnemy: config?.shotsPerEnemy ?? 1,
            shotDelay: config?.shotDelay ?? { min: 1000, max: 3000 },
            spawnDelay: config?.spawnDelay,
            oscillate: config?.oscillate,
            oscillateDistance: config?.oscillateDistance,
            oscillateSpeed: config?.oscillateSpeed,
            continuousFire: config?.continuousFire
        };
    }

    spawn(): void {
        const { positions } = this.config;

        positions.forEach((pos, index) => {
            // Cycle through configs
            const configIndex = index % this.shipConfigs.length;
            const shipConfig = this.shipConfigs[configIndex];

            const ship = new this.shipClass(this.scene, pos.x, pos.y, shipConfig, this.collisionConfig);
            const enemy = ship.sprite;
            enemy.setRotation(Math.PI / 2); // Face down

            this.enemies.push({
                ship: ship,
                spawnTime: this.scene.time.now,
                startX: pos.x,
                startY: pos.y
            });

            this.scheduleShootingBehavior(ship, enemy, this.config);
        });
    }

    update(time: number, _delta: number): void {
        // Filter out destroyed enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemyData = this.enemies[i];
            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) {
                this.enemies.splice(i, 1);
            }
        }

        // Oscillation movement (fly forward, snap back to origin)
        if (this.config.oscillate) {
            const screenHeight = this.scene.scale.height;
            // If distance is 0 or not set, use full screen (from startY to bottom)
            const speed = this.config.oscillateSpeed ?? 0.1; // pixels per ms

            for (const enemyData of this.enemies) {
                if (enemyData.ship?.sprite?.active) {
                    // Account for sprite height so ship is fully off-screen at start and end
                    const shipHeight = enemyData.ship.sprite.displayHeight || 50;
                    // Distance from start to bottom of screen, plus ship height to ensure fully off-screen
                    const distance = this.config.oscillateDistance || (screenHeight - enemyData.startY + shipHeight);
                    const elapsed = time - enemyData.spawnTime;
                    // Calculate cycle duration based on distance and speed
                    const cycleDuration = distance / speed;
                    // Sawtooth: progress goes 0 to 1, then resets
                    const progress = (elapsed % cycleDuration) / cycleDuration;
                    const offset = progress * distance;

                    // Always maintain position and rotation to prevent physics drift
                    enemyData.ship.sprite.x = enemyData.startX;
                    enemyData.ship.sprite.y = enemyData.startY + offset;
                    enemyData.ship.sprite.setRotation(Math.PI / 2); // Always face down
                    enemyData.ship.sprite.setAngularVelocity(0); // Prevent rotation accumulation
                    enemyData.ship.sprite.setVelocity(0, 0); // Prevent position drift from physics
                }
            }
        }
    }
}
