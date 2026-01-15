import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import type { IFormation, BaseEnemyData } from './types';


const BOUNDS_BUFFER = 200;
const SPAWN_Y = -200;

export interface DiamondFormationConfig {
    spacing?: number;
    verticalSpacing?: number;
    startWidthPercentage: number;
    endWidthPercentage: number;
    autoFire?: boolean;
    rotation?: number;

    /** 2D grid defining ships per row. null = empty position (spacing preserved) */
    shipFormationGrid: (ShipConfig | null)[][];
}

export interface DiamondEnemyData extends BaseEnemyData {
    ship: Ship;
    spawnTime: number;
    startX: number;
    startY: number;
}

export class DiamondFormation implements IFormation {
    protected scene: Phaser.Scene;
    protected enemies: DiamondEnemyData[] = [];
    protected shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship;
    protected collisionConfig: ShipCollisionConfig;

    private config: Required<Pick<DiamondFormationConfig, 'spacing' | 'verticalSpacing' | 'startWidthPercentage' | 'autoFire' | 'shipFormationGrid' | 'rotation'>>;

    constructor(
        scene: Phaser.Scene,
        shipClass: new (scene: Phaser.Scene, x: number, y: number, config: ShipConfig, collisionConfig: ShipCollisionConfig) => Ship,
        collisionConfig: ShipCollisionConfig,
        config?: DiamondFormationConfig,
        _shipConfigs?: ShipConfig[] // Deprecated, kept for interface compatibility
    ) {
        this.scene = scene;
        this.shipClass = shipClass;
        this.collisionConfig = collisionConfig;

        const defaultRotation = (() => {
            if (config?.rotation !== undefined) return config.rotation;

            const startPct = config?.startWidthPercentage ?? 0.5;
            const endPct = config?.endWidthPercentage ?? 0.5;
            const width = scene.scale.width;
            const startX = width * startPct;
            const endX = width * endPct;
            const dx = endX - startX;
            const dy = scene.scale.height + 400;
            const angle = Math.atan2(dy, dx);
            return angle - Math.PI / 2;
        })();

        this.config = {
            spacing: 80,
            verticalSpacing: 60,
            startWidthPercentage: config?.startWidthPercentage ?? 0.5,
            endWidthPercentage: config?.endWidthPercentage ?? 0.5,
            autoFire: config?.autoFire || false,
            shipFormationGrid: config?.shipFormationGrid || [[null]],
            rotation: defaultRotation,
            ...config
        };

        // Load textures for all ship configs in the grid
        this.loadTextures();
    }

    private loadTextures(): void {
        for (const row of this.config.shipFormationGrid) {
            for (const shipConfig of row) {
                if (shipConfig?.definition?.createTextures) {
                    shipConfig.definition.createTextures(this.scene);
                }
            }
        }
    }

    spawn(): void {
        const { width } = this.scene.scale;
        const startCenterX = width * this.config.startWidthPercentage;
        const rotationAngle = this.config.rotation;

        for (let rowIndex = 0; rowIndex < this.config.shipFormationGrid.length; rowIndex++) {
            const row = this.config.shipFormationGrid[rowIndex];
            const depth = rowIndex * this.config.verticalSpacing;

            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const shipConfig = row[colIndex];

                // Skip null positions (empty grid spots)
                if (shipConfig === null) continue;

                // Local position in formation space
                const localX = (colIndex - (row.length - 1) / 2) * this.config.spacing;
                const localY = -depth;

                // Rotate formation shape
                const cos = Math.cos(rotationAngle);
                const sin = Math.sin(rotationAngle);
                const rotatedX = localX * cos - localY * sin;
                const rotatedY = localX * sin + localY * cos;

                const x = startCenterX + rotatedX;
                const y = SPAWN_Y + rotatedY;

                const ship = new this.shipClass(this.scene, x, y, shipConfig, this.collisionConfig);
                const enemy = ship.sprite;
                enemy.setData('ship', ship);

                this.enemies.push({
                    ship: ship,
                    spawnTime: this.scene.time.now,
                    startX: x,
                    startY: y
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

            // Handle auto-fire
            if (this.config.autoFire) {
                this.fireEnemyLaser(enemyData.ship);
            }

            if (enemy.y > height + BOUNDS_BUFFER || enemy.x < -BOUNDS_BUFFER || enemy.x > this.scene.scale.width + BOUNDS_BUFFER) {
                enemyData.ship.destroy();
                this.enemies.splice(i, 1);
            }
        }
    }

    isComplete(): boolean {
        return this.enemies.length === 0;
    }

    getShips(): DiamondEnemyData[] {
        return this.enemies;
    }

    destroy(): void {
        this.enemies.forEach(enemyData => {
            enemyData.ship.destroy();
        });
        this.enemies = [];
    }

    protected fireEnemyLaser(ship: Ship): void {
        if (!ship.sprite.active) return;
        ship.fireLasers();
    }
}
