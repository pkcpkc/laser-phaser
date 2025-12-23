import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../ships/ship';
import type { ShipConfig } from '../ships/types';
import { BaseFormation } from './base-formation';

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
            formationGrid: [1, 2, 3], // Default 1-2-3 pattern
            ...config
        };
    }

    spawn(): void {
        const { width, height } = this.scene.scale;
        const startCenterX = width * this.config.startWidthPercentage;
        const endCenterX = width * this.config.endWidthPercentage;

        // Calculate travel direction
        const deltaX = endCenterX - startCenterX;
        const deltaY = height + 150; // Full vertical distance
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
                const y = -65 + rotatedY;
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
                    wobbleSpeed: 0.8 + Math.random() * 0.4
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

            const speed = enemyData.ship.config.definition.gameplay.speed || 2;

            // Calculate movement direction from start to target
            const deltaX = enemyData.targetX - enemyData.startX;
            const deltaY = height + 100; // Distance to travel vertically

            // Normalize direction
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const moveX = deltaX / distance;
            const moveY = deltaY / distance;

            // Add individual wobble for liveliness
            const wobbleTime = time * 0.001 * enemyData.wobbleSpeed + enemyData.wobbleOffset;
            const wobbleX = Math.sin(wobbleTime * 2) * this.config.movementVariation;
            const wobbleY = Math.cos(wobbleTime * 1.5) * (this.config.movementVariation * 0.3);

            // Calculate new position
            const timeProgress = elapsed / 16.66;
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
            // Check if out of bounds (all directions) - widened buffer zones
            // Calculate dynamic top bound based on formation depth
            const maxDepth = this.config.formationGrid.length * this.config.verticalSpacing;
            const topBound = -500 - maxDepth;

            if (enemy.y > height + 200 || enemy.y < topBound || enemy.x < -200 || enemy.x > this.scene.scale.width + 200) {
                enemyData.ship.destroy();
                this.enemies.splice(i, 1);
            }
        }
    }

    getEnemies(): EnemyData[] {
        return this.enemies;
    }
}
