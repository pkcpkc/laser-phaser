import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import { BaseFormation } from './base-formation';

// Movement & Spawning Constants
// Bounds buffer is handled by Tactic or generic check? 
// Ideally Tactic handles global bounds, but Formation might want self-cleanup.
const BOUNDS_BUFFER = 200;
const SPAWN_Y = -200;

export interface DiamondFormationConfig {
    spacing?: number;
    verticalSpacing?: number;
    startWidthPercentage: number;
    endWidthPercentage: number;
    shotsPerEnemy?: number;
    shotDelay?: { min: number; max: number };
    continuousFire?: boolean;

    formationGrid: number[];
    // We can also accept an angle to pre-rotate the formation alignment?
    rotation?: number;
}

export interface DiamondEnemyData {
    ship: Ship;
    spawnTime: number;
    startX: number;
    startY: number;

}

export class DiamondFormation extends BaseFormation {
    private config: Required<Pick<DiamondFormationConfig, 'spacing' | 'verticalSpacing' | 'startWidthPercentage' | 'shotsPerEnemy' | 'shotDelay' | 'continuousFire' | 'formationGrid' | 'rotation'>>;
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
                    startY: y
                });

                this.scheduleShootingBehavior(ship, enemy, {
                    shotsPerEnemy: this.config.shotsPerEnemy,
                    shotDelay: this.config.shotDelay,
                    continuousFire: this.config.continuousFire
                });
            }
        }
    }

    update(_time: number): void {
        const { height } = this.scene.scale;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemyData = this.enemies[i];

            if (!enemyData.ship || !enemyData.ship.sprite || !enemyData.ship.sprite.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            const enemy = enemyData.ship.sprite;

            // Cleanup checks
            if (enemy.y > height + BOUNDS_BUFFER || enemy.x < -BOUNDS_BUFFER || enemy.x > this.scene.scale.width + BOUNDS_BUFFER) {
                enemyData.ship.destroy();
                this.enemies.splice(i, 1);
            }
        }
    }
}


