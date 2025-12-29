import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import { generateSmallAsteroidTexture, generateAsteroidSurfaceTexture } from '../../../ships/definitions/asteroid-small';
import { generateMediumAsteroidTexture } from '../../../ships/definitions/asteroid-medium';
import { generateLargeAsteroidTexture } from '../../../ships/definitions/asteroid-large';
import { SmallAsteroidDustConfig } from '../../../ships/configurations/asteroid-small-dust';
import { MediumAsteroidDustConfig } from '../../../ships/configurations/asteroid-medium-dust';
import { LargeAsteroidDustConfig } from '../../../ships/configurations/asteroid-large-dust';
import { AsteroidMorphEffect } from '../../../ships/effects/asteroid-morph-effect';

import type { BaseEnemyData } from './base-formation';

interface AsteroidFieldConfig {
    count?: number;
    spawnWidth?: number;
    minSpeed?: number;
    maxSpeed?: number;
    sizeWeights?: { small: number; medium: number; large: number };
}

const DEFAULT_CONFIG: Required<AsteroidFieldConfig> = {
    count: 5,
    spawnWidth: 0.8,
    minSpeed: 0.5,
    maxSpeed: 2,
    sizeWeights: { small: 0.5, medium: 0.35, large: 0.15 }
};

// Asteroid radii for spawn positioning
const ASTEROID_RADII = {
    'asteroid-small': 15,
    'asteroid-medium': 25,
    'asteroid-large': 40
};

export class AsteroidFieldFormation {
    private scene: Phaser.Scene;
    private ships: BaseEnemyData[] = [];
    private collisionConfig: ShipCollisionConfig;
    private config: Required<AsteroidFieldConfig>;
    private texturesGenerated: boolean = false;

    constructor(
        scene: Phaser.Scene,
        _shipClass: unknown,
        collisionConfig: ShipCollisionConfig,
        config?: AsteroidFieldConfig
    ) {
        this.scene = scene;
        this.collisionConfig = collisionConfig;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    private generateTextures(): void {
        if (this.texturesGenerated) return;
        generateSmallAsteroidTexture(this.scene);
        generateMediumAsteroidTexture(this.scene);
        generateLargeAsteroidTexture(this.scene);

        // Generate Surface Textures for Morphing (5 variants each)
        for (let i = 0; i < 5; i++) {
            // Small (Radius 15 -> Size ~40)
            generateAsteroidSurfaceTexture(this.scene, `asteroid-small-surface-${i}`, 40, {
                fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
            });
            // Medium (Radius 25 -> Size ~60)
            generateAsteroidSurfaceTexture(this.scene, `asteroid-medium-surface-${i}`, 60, {
                fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
            });
            // Large (Radius 40 -> Size ~90)
            generateAsteroidSurfaceTexture(this.scene, `asteroid-large-surface-${i}`, 90, {
                fill: 0x2C2C2C, stroke: 0x252525, fissure: 0x151515, highlight: 0x454545
            });
        }

        this.texturesGenerated = true;
    }

    private pickRandomConfig(): ShipConfig {
        const weights = this.config.sizeWeights;
        const random = Math.random();

        if (random < weights.small) {
            return SmallAsteroidDustConfig;
        } else if (random < weights.small + weights.medium) {
            return MediumAsteroidDustConfig;
        } else {
            return LargeAsteroidDustConfig;
        }
    }

    private getRadius(config: ShipConfig): number {
        return ASTEROID_RADII[config.definition.id as keyof typeof ASTEROID_RADII] || 20;
    }

    spawn(): void {
        this.generateTextures();

        const { width } = this.scene.scale;
        const spawnMargin = (1 - this.config.spawnWidth) / 2;

        for (let i = 0; i < this.config.count; i++) {
            // 1. Pick base config
            const baseConfig = this.pickRandomConfig();

            // 2. Clone and randomize texture
            // We must shallow clone up to definition to avoid mutating the shared consts
            const asteroidConfig: ShipConfig = {
                ...baseConfig,
                definition: {
                    ...baseConfig.definition,
                    assetKey: `${baseConfig.definition.id}-texture-${Phaser.Math.Between(0, 4)}`
                }
            };

            const radius = this.getRadius(asteroidConfig);
            const x = width * (spawnMargin + Math.random() * this.config.spawnWidth);
            const y = -radius - Math.random() * 100;

            const ship = new Ship(
                this.scene,
                x,
                y,
                asteroidConfig,
                this.collisionConfig
            );

            // 3. Apply random low speed rotation - REMOVED per user request
            // const sign = Math.random() < 0.5 ? 1 : -1;
            // const rotationSpeed = sign * (0.005 + Math.random() * 0.02); 
            // ship.sprite.setAngularVelocity(rotationSpeed);

            // 4. Add Vertex Morph Effect
            // Base surface key prefix
            const surfaceKeyPrefix = `${baseConfig.definition.id}-surface`;

            // Note: radius is available here
            const r = this.getRadius(asteroidConfig);

            ship.setEffect(new AsteroidMorphEffect(this.scene, ship.sprite, surfaceKeyPrefix, r, 5));

            this.ships.push({
                ship,
                spawnTime: this.scene.time.now,
                startX: x,
                startY: y
            });
        }

        console.log(`AsteroidFieldFormation spawned ${this.ships.length} asteroids`);
    }

    update(_time: number, _delta?: number): void {
        const { height } = this.scene.scale;

        this.ships = this.ships.filter(data => {
            try {
                if (!data.ship.sprite || !data.ship.sprite.active) {
                    return false;
                }

                if (data.ship.sprite.y > height + 100) {
                    data.ship.destroy();
                    return false;
                }

                return true;
            } catch {
                return false;
            }
        });
    }

    isComplete(): boolean {
        return this.ships.length === 0;
    }

    getEnemies(): BaseEnemyData[] {
        return this.ships;
    }

    getShips(): BaseEnemyData[] {
        return this.ships;
    }

    destroy(): void {
        this.ships.forEach(data => {
            data.ship.destroy();
        });
        this.ships = [];
    }
}
