import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import { BaseFormation } from './base-formation';

// Movement & Spawning Constants
const SPAWN_Y_OFFSET = -200;
const SCREEN_DIVISOR_MIN_SHIPS = 250;
const SCREEN_DIVISOR_MAX_SHIPS = 150;
const FRAME_DURATION_MS = 16.66;
const BOUNDS_BUFFER = 50;
const DEFAULT_SPEED = 2;
const TIME_OFFSET_PER_ENEMY = 0.5;

export interface FormationConfig {
    enemyCount: number;
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
        shipConfigs?: ShipConfig[]
    ) {
        super(scene, shipClass, collisionConfig, shipConfigs);

        // Default configuration
        this.config = {
            enemyCount: 3,
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
        const startY = SPAWN_Y_OFFSET;

        // Dynamic ship count based on width
        const minShips = Math.max(2, Math.floor(width / SCREEN_DIVISOR_MIN_SHIPS));
        let maxShips = Math.max(3, Math.floor(width / SCREEN_DIVISOR_MAX_SHIPS));

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

            // Pick random ship config
            const shipConfig = Phaser.Utils.Array.GetRandom(this.shipConfigs);

            const ship = new this.shipClass(this.scene, x, y, shipConfig, this.collisionConfig);
            const enemy = ship.sprite;
            enemy.setData('ship', ship);

            enemy.setVelocityY(ship.config.definition.gameplay.speed || DEFAULT_SPEED);

            // Store spawn time for deterministic movement
            this.enemies.push({
                ship: ship,
                startX: x,
                timeOffset: i * TIME_OFFSET_PER_ENEMY,
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

            const speed = enemyData.ship.config.definition.gameplay.speed || DEFAULT_SPEED;

            // X movement: Sinus
            const phase = time * this.config.frequency + enemyData.timeOffset;
            const newX = enemyData.startX + Math.sin(phase) * this.config.amplitude;

            // Y movement: Linear based on time (ignoring physics recoil)
            const newY = SPAWN_Y_OFFSET + enemyData.verticalOffset + (speed * (elapsed / FRAME_DURATION_MS));

            enemy.setPosition(newX, newY);
            enemy.setVelocity(0, 0); // Override physics velocity to prevent recoil

            // Calculate rotation based on path derivative
            const vx = this.config.amplitude * this.config.frequency * Math.cos(phase) * FRAME_DURATION_MS;
            const vy = speed;

            // Rotate ship to face direction of movement
            enemy.setRotation(Math.atan2(vy, vx));

            // Check if out of bounds (bottom)
            if (enemy.y > height + BOUNDS_BUFFER) {
                enemyData.ship.destroy();
                this.enemies.splice(i, 1);
            }
        }
    }

    getEnemies(): EnemyData[] {
        return this.enemies;
    }
}

