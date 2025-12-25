import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import { BaseFormation } from './base-formation';

// Movement & Spawning Constants
const SPAWN_Y = -65;
const TRAVEL_Y_BUFFER = 150;
const WOBBLE_SPEED_BASE = 0.8;
const WOBBLE_SPEED_RANGE = 0.4;
const WOBBLE_TIME_SCALE = 0.001;
const WOBBLE_X_MULTIPLIER = 2;
const WOBBLE_Y_MULTIPLIER = 1.5;
const WOBBLE_Y_SCALE = 0.3;
const FRAME_DURATION_MS = 16.66;
const BOUNDS_BUFFER = 200;
const TOP_BOUND_BASE = -500;
const VERTICAL_TRAVEL_BUFFER = 100;
const DEFAULT_SPEED = 2;

export interface DiamondFormationConfig {
    spacing?: number;
    verticalSpacing?: number;
    startWidthPercentage?: number; // Where formation starts horizontally (0.5 = center)
    endWidthPercentage?: number;   // Where formation ends/aims (0.5 = center, straight down)
    shootingChance?: number;
    shotsPerEnemy?: number;
    shotDelay?: { min: number; max: number };
    continuousFire?: boolean;
    movementVariation?: number; // Amount of individual movement (default: 10)
    formationGrid?: number[]; // Optional custom grid configuration (e.g. [1, 2, 3])
}

export interface EnemyData {
    ship: Ship;
    startX: number;
    startY: number;
    targetX: number; // Target X position at bottom of screen
    spawnTime: number;
    wobbleOffset: number; // Individual wobble phase offset
    wobbleSpeed: number; // Individual wobble speed
}

export class DiamondFormation extends BaseFormation {
    private config: Required<DiamondFormationConfig>;
    protected enemies: EnemyData[] = [];

    constructor(
        scene: Phaser.Scene,
        shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        collisionConfig: ShipCollisionConfig,
        config?: DiamondFormationConfig,
        shipConfig?: ShipConfig
    ) {
        super(scene, shipClass, collisionConfig, shipConfig);

        // Default configuration
        this.config = {
            spacing: 80,
            verticalSpacing: 60,
            startWidthPercentage: 0.5, // Default: center screen
            endWidthPercentage: 0.5,   // Default: straight down
            shootingChance: 0.5,
            shotsPerEnemy: 1,
            shotDelay: { min: 1000, max: 3000 },
            continuousFire: false,
            movementVariation: 10,
            formationGrid: config?.formationGrid || [1, 2, 3], // Default 1-2-3 pattern
            ...config
        };
    }

    spawn(): void {
        const { width, height } = this.scene.scale;
        const startCenterX = width * this.config.startWidthPercentage;
        const endCenterX = width * this.config.endWidthPercentage;

        // Calculate travel direction
        const deltaX = endCenterX - startCenterX;
        const deltaY = height + TRAVEL_Y_BUFFER; // Full vertical distance
        const travelAngle = Math.atan2(deltaY, deltaX);

        // Correct rotation: Formation points DOWN by default (Positive Y)
        // So we rotate by (TravelAngle - PI/2) to align it
        const rotationAngle = travelAngle - Math.PI / 2;

        // Use custom formation grid or default to what was set in constructor (defaults to [1, 2, 3])
        const rows = this.config.formationGrid.map((count, index) => ({
            count: count,
            depth: index * this.config.verticalSpacing
        }));

        for (const row of rows) {
            for (let i = 0; i < row.count; i++) {
                // Local position in formation space
                const localX = (i - (row.count - 1) / 2) * this.config.spacing; // Horizontal spread
                const localY = -row.depth; // Depth (negative = behind the front)

                // Rotate formation to align with travel direction
                const cos = Math.cos(rotationAngle);
                const sin = Math.sin(rotationAngle);
                const rotatedX = localX * cos - localY * sin;
                const rotatedY = localX * sin + localY * cos;

                // Position ships
                const x = startCenterX + rotatedX;
                const y = SPAWN_Y + rotatedY;
                const targetX = endCenterX + rotatedX;

                const ship = new this.shipClass(this.scene, x, y, this.shipConfig!, this.collisionConfig);
                const enemy = ship.sprite;
                enemy.setData('ship', ship);

                this.enemies.push({
                    ship: ship,
                    startX: x,
                    startY: y,
                    targetX: targetX,
                    spawnTime: this.scene.time.now,
                    wobbleOffset: Math.random() * Math.PI * 2,
                    wobbleSpeed: WOBBLE_SPEED_BASE + Math.random() * WOBBLE_SPEED_RANGE
                });

                this.scheduleShootingBehavior(ship, enemy, {
                    shootingChance: this.config.shootingChance,
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

            // Safety check for destroyed ships
            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            const enemy = enemyData.ship.sprite;
            const elapsed = time - enemyData.spawnTime;

            if (elapsed < 0) {
                continue;
            }

            const speed = enemyData.ship.config.definition.gameplay.speed || DEFAULT_SPEED;

            // Calculate movement direction from start to target
            const deltaX = enemyData.targetX - enemyData.startX;
            const deltaY = height + VERTICAL_TRAVEL_BUFFER; // Distance to travel vertically

            // Normalize direction
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const moveX = deltaX / distance;
            const moveY = deltaY / distance;

            // Add individual wobble for liveliness
            const wobbleTime = time * WOBBLE_TIME_SCALE * enemyData.wobbleSpeed + enemyData.wobbleOffset;
            const wobbleX = Math.sin(wobbleTime * WOBBLE_X_MULTIPLIER) * this.config.movementVariation;
            const wobbleY = Math.cos(wobbleTime * WOBBLE_Y_MULTIPLIER) * (this.config.movementVariation * WOBBLE_Y_SCALE);

            // Calculate new position
            const timeProgress = elapsed / FRAME_DURATION_MS;
            const baseX = enemyData.startX + (moveX * speed * timeProgress);
            const baseY = enemyData.startY + (moveY * speed * timeProgress);

            const newX = baseX + wobbleX;
            const newY = baseY + wobbleY;

            enemy.setPosition(newX, newY);
            enemy.setVelocity(0, 0); // Override physics velocity

            // Rotate ship to face movement direction
            const rotation = Math.atan2(moveY, moveX);
            enemy.setRotation(rotation);

            // Check if out of bounds (all directions) - widened buffer zones
            // Calculate dynamic top bound based on formation depth
            const maxDepth = this.config.formationGrid.length * this.config.verticalSpacing;
            const topBound = TOP_BOUND_BASE - maxDepth;

            if (enemy.y > height + BOUNDS_BUFFER || enemy.y < topBound || enemy.x < -BOUNDS_BUFFER || enemy.x > this.scene.scale.width + BOUNDS_BUFFER) {
                enemyData.ship.destroy();
                this.enemies.splice(i, 1);
            }
        }
    }

    getEnemies(): EnemyData[] {
        return this.enemies;
    }
}

