import Phaser from 'phaser';
import { Ship, type ShipCollisionConfig } from '../../../ships/ship';
import type { ShipConfig } from '../../../ships/types';
import { BaseFormation } from './base-formation';
import { SmallAsteroidDustConfig } from '../../../ships/configurations/asteroid-small-dust';
import { MediumAsteroidDustConfig } from '../../../ships/configurations/asteroid-medium-dust';
import { LargeAsteroidDustConfig } from '../../../ships/configurations/asteroid-large-dust';
import { AsteroidMorphEffect } from '../../../ships/effects/asteroid-morph-effect';

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

export class AsteroidFieldFormation extends BaseFormation {
    private config: Required<AsteroidFieldConfig>;

    constructor(
        scene: Phaser.Scene,
        _shipClass: unknown, // Unused but kept for signature compatibility if needed, or we can just ignore it as we use specific configs
        collisionConfig: ShipCollisionConfig,
        config?: AsteroidFieldConfig
    ) {
        // Pass generic Ship class and asteroid configs for texture loading
        super(
            scene,
            Ship as any,
            collisionConfig,
            [SmallAsteroidDustConfig, MediumAsteroidDustConfig, LargeAsteroidDustConfig]
        );
        this.config = { ...DEFAULT_CONFIG, ...config };
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
                    assetKey: `${baseConfig.definition.id}-texture-${Phaser.Math.Between(0, 4)}`,
                    physics: {
                        ...baseConfig.definition.physics,
                        // Randomize mass by +/- 15% to create speed variation
                        mass: (baseConfig.definition.physics.mass || 1) * Phaser.Math.FloatBetween(0.85, 1.15)
                    }
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

            // 3. Add Vertex Morph Effect
            // Base surface key prefix
            const surfaceKeyPrefix = `${baseConfig.definition.id}-surface`;

            // Note: radius is available here
            const r = this.getRadius(asteroidConfig);

            ship.setEffect(new AsteroidMorphEffect(this.scene, ship.sprite, surfaceKeyPrefix, r, 5));

            this.enemies.push({
                ship,
                spawnTime: this.scene.time.now + Phaser.Math.Between(100, 400), // Add random delay to break up lines
                startX: x,
                startY: y
            });
        }

        console.log(`AsteroidFieldFormation spawned ${this.enemies.length} asteroids`);
    }

    update(_time: number, _delta?: number): void {
        const { height } = this.scene.scale;

        this.enemies = this.enemies.filter(data => {
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
}
