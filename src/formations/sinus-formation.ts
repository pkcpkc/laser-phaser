import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../ships/ship';
import type { ShipConfig } from '../ships/types';
import { BaseFormation } from './base-formation';

export interface FormationConfig {
    enemyCount: { min: number; max: number };
    spacing: number;
    verticalOffset: number;
    amplitude: number;
    frequency: number;
    shootingChance: number;
    shotsPerEnemy: number;
    shotDelay: { min: number; max: number };
    continuousFire?: boolean;
}

export interface EnemyData {
    ship: Ship;
    startX: number;
    timeOffset: number;
    spawnTime: number;
    verticalOffset: number;
}

export class SinusFormation extends BaseFormation {
    private config: FormationConfig;
    protected enemies: EnemyData[] = [];

    constructor(
        scene: Phaser.Scene,
        shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        collisionConfig: ShipCollisionConfig,
        config?: Partial<FormationConfig>,
        shipConfig?: ShipConfig
    ) {
        super(scene, shipClass, collisionConfig, shipConfig);

        // Default configuration
        this.config = {
            enemyCount: { min: 3, max: 6 },
            spacing: 100,
            verticalOffset: 60,
            amplitude: 50,
            frequency: 0.002,
            shootingChance: 0.5,
            shotsPerEnemy: 1,
            shotDelay: { min: 1000, max: 3000 },
            ...config
        };
    }

    spawn(): void {
        const { width } = this.scene.scale;
        const startX = width * 0.5;
        const startY = -50; // Start slightly above screen

        // Dynamic ship count based on width
        const minShips = Math.max(2, Math.floor(width / 250));
        let maxShips = Math.max(3, Math.floor(width / 150));

        // Ensure max is at least min
        if (maxShips < minShips) {
            maxShips = minShips;
        }

        // Random number of enemies
        const numEnemies = Phaser.Math.Between(minShips, maxShips);

        for (let i = 0; i < numEnemies; i++) {
            const x = startX + (i - Math.floor(numEnemies / 2)) * this.config.spacing;

            // Alternate between upper and lower positions
            const yOffset = (i % 2 === 0) ? 0 : this.config.verticalOffset;
            const y = startY + yOffset;

            const ship = new this.shipClass(this.scene, x, y, this.shipConfig!, this.collisionConfig);
            const enemy = ship.sprite;
            enemy.setData('ship', ship);

            enemy.setVelocityY(ship.config.definition.gameplay.speed || 2); // Initial velocity downwards

            // Store spawn time for deterministic movement
            this.enemies.push({
                ship: ship,
                startX: x,
                timeOffset: i * 0.5,
                spawnTime: this.scene.time.now,
                verticalOffset: yOffset
            });

            // Shooting behavior
            this.scheduleShootingBehavior(ship, enemy, {
                shootingChance: this.config.shootingChance,
                shotsPerEnemy: this.config.shotsPerEnemy,
                shotDelay: this.config.shotDelay,
                continuousFire: this.config.continuousFire
            });
        }
    }

    update(time: number): void {
        const { height } = this.scene.scale;


        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemyData = this.enemies[i];

            // Safety check for destroyed ships
            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            const enemy = enemyData.ship.sprite;

            // Deterministic movement calculation
            // Use time since spawn to determine position
            const elapsed = time - enemyData.spawnTime;

            // Safety: if elapsed is weirdly negative, clamp it?
            if (elapsed < 0) {
                // Should not happen if time is monotonic
                continue;
            }

            const speed = enemyData.ship.config.definition.gameplay.speed || 2;

            // X movement: Sinus
            const phase = time * this.config.frequency + enemyData.timeOffset;
            const newX = enemyData.startX + Math.sin(phase) * this.config.amplitude;

            // Y movement: Linear based on time (ignoring physics recoil)
            const newY = -50 + enemyData.verticalOffset + (speed * (elapsed / 16.66)); // 16.66ms per frame reference

            enemy.setPosition(newX, newY);
            enemy.setVelocity(0, 0); // Override physics velocity to prevent recoil

            // Calculate rotation based on path derivative
            const vx = this.config.amplitude * this.config.frequency * Math.cos(phase) * 16.66;
            const vy = speed;

            // Rotate ship to face direction of movement
            enemy.setRotation(Math.atan2(vy, vx));

            // Check if out of bounds (bottom)
            if (enemy.y > height + 50) {
                enemyData.ship.destroy();
                this.enemies.splice(i, 1);
            }
        }
    }

    getEnemies(): EnemyData[] {
        return this.enemies;
    }
}
