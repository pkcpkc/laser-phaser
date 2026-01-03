import Phaser from 'phaser';
import { BaseFormation, type BaseEnemyData } from './base-formation';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';

// Extend BaseEnemyData to include positioning data needed by Tactics
export interface LineEnemyData extends BaseEnemyData {
    startX: number;
    startY: number;
    timeOffset: number; // For wave tactics
    verticalOffset: number; // For wave tactics
}

export interface LineFormationConfig {
    enemyCount: number;
    spacing: number;
    verticalOffset: number; // Alternating vertical offset (zig-zag line)
    spawnY?: number;
    shootingChance?: number;
    shotsPerEnemy?: number;
    shotDelay?: { min: number; max: number };
    continuousFire?: boolean;
}

const SPAWN_Y_OFFSET = -200;
const TIME_OFFSET_PER_ENEMY = 0.5;

export class LineFormation extends BaseFormation {
    private config: LineFormationConfig;
    // @ts-ignore - We know we are storing LineEnemyData
    protected enemies: LineEnemyData[] = [];

    constructor(
        scene: Phaser.Scene,
        shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        collisionConfig: ShipCollisionConfig,
        config?: Partial<LineFormationConfig>,
        shipConfigs?: ShipConfig[]
    ) {
        super(scene, shipClass, collisionConfig, shipConfigs);

        this.config = {
            enemyCount: 3,
            spacing: 100,
            verticalOffset: 60,
            spawnY: SPAWN_Y_OFFSET,
            shootingChance: 0.5,
            shotsPerEnemy: 1,
            shotDelay: { min: 1000, max: 3000 },
            ...config
        };
    }

    spawn(): void {
        const { width } = this.scene.scale;
        const startX = width * 0.5;
        const startY = this.config.spawnY ?? SPAWN_Y_OFFSET;

        // Determine count
        const numEnemies = this.config.enemyCount;

        for (let i = 0; i < numEnemies; i++) {
            const x = startX + (i - Math.floor(numEnemies / 2)) * this.config.spacing;
            const yOffset = (i % 2 === 0) ? 0 : this.config.verticalOffset;
            const y = startY + yOffset;

            // Cycle through ship configs
            const configIndex = i % this.shipConfigs.length;
            const shipConfig = this.shipConfigs[configIndex];

            const ship = new this.shipClass(this.scene, x, y, shipConfig, this.collisionConfig);
            const enemy = ship.sprite;

            // Critical: Store the initial state on the generic data object so Tactics can use it if they want
            // But we primarily store it in our local enemy data
            enemy.setData('ship', ship);

            this.enemies.push({
                ship: ship,
                spawnTime: this.scene.time.now,
                startX: x,
                startY: y, // This is the "base" Y without travel
                timeOffset: i * TIME_OFFSET_PER_ENEMY,
                verticalOffset: yOffset
            });

            this.scheduleShootingBehavior(ship, enemy, {
                shotsPerEnemy: this.config.shotsPerEnemy ?? 0,
                shotDelay: this.config.shotDelay ?? { min: 1000, max: 2000 },
                continuousFire: this.config.continuousFire
            });
        }
    }

    update(_time: number, _delta: number): void {
        // LineFormation does not enforce movement itself.
        // It relies on a Tactic. 
        // But we must clean up dead ships.
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemyData = this.enemies[i];
            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) {
                this.enemies.splice(i, 1);
            }
        }
    }
}
