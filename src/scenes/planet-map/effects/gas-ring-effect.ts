import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { BaseEffectConfig } from '../planet-effect';
import { BaseRingEffect } from './base-ring-effect';

export interface GasRingConfig extends BaseEffectConfig {
    type: 'gas-ring';
    color: number;
    angle?: number;
    lifespan?: number;
}

export class GasRingEffect extends BaseRingEffect {
    private config: GasRingConfig;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: GasRingConfig) {
        super(scene, planet, { angle: config.angle });
        this.config = config;
        this.create();
    }

    private create() {
        const ringColor = this.config.color;
        const scale = this.planet.visualScale || 1.0;

        // 1. Reduce diameter (was 60/16) -> User requested broader: 55 -> Back to 48 but thicker
        const radiusX = 48 * scale;
        const radiusY = 8 * scale; // Reduced from 14 to 8 for flatter look
        const thickness = 8 * scale; // Slightly reduced thickness (was 10)
        // const tiltDeg = this.config.angle ?? -20; // Handled in base
        const tilt = this.tilt;


        const createEmitter = (isFront: boolean) => {
            return this.scene.add.particles(0, 0, 'flare-white', {
                color: [ringColor],
                alpha: { start: 0.5, end: 0 }, // Reduced alpha for higher density
                scale: { start: 0.15 * scale, end: 0 }, // Slightly smaller particles
                lifespan: this.config.lifespan || 800, // Configurable lifespan
                blendMode: 'ADD',
                frequency: 5, // Much more dense (was 40)
                speed: { min: 0, max: 10 * scale }, // Gentle drift instead of orbital flow
                angle: { min: 0, max: 360 }, // Random direction

                emitZone: {
                    source: {
                        getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
                            // Robust Geometric Approach:
                            // 1. Pick ANY point on the full ring.
                            // 2. Filter by Y (screen space Y relative to center).
                            // Front (Depth 10) -> Bottom Half (y > -overlap)
                            // Back (Depth 0) -> Top Half (y < +overlap) (with overlap)

                            const centerX = 0;
                            const centerY = 0;

                            // Retry loop to find valid point
                            let valid = false;
                            let attempts = 0;

                            while (!valid && attempts < 10) {
                                attempts++;

                                // Random angle 0-2PI
                                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);

                                // Add thickness
                                const rJitter = Phaser.Math.FloatBetween(-thickness, thickness);
                                const rX = radiusX + rJitter;
                                const rY = radiusY + (rJitter * (radiusY / radiusX));

                                // Unrotated ellipse point
                                const ux = rX * Math.cos(angle);
                                const uy = rY * Math.sin(angle);

                                // Rotate by tilt
                                const tx = ux * Math.cos(tilt) - uy * Math.sin(tilt);
                                const ty = ux * Math.sin(tilt) + uy * Math.cos(tilt);

                                // Check condition
                                // isFront (Bottom) -> ty > -2
                                // !isFront (Top) -> ty < 2
                                // Overlap of 4 pixels
                                const tolerance = 4; // Generous overlap to prevent gaps

                                if (isFront) {
                                    if (ty > -tolerance) valid = true;
                                } else {
                                    if (ty < tolerance) valid = true;
                                }

                                if (valid) {
                                    point.x = centerX + tx;
                                    point.y = centerY + ty;
                                }
                            }

                            // If we failed to find a point (highly unlikely in 10 tries unless ranges are broken), return center? 
                            // Or just return the last calculated point?
                            return point;
                        }
                    },
                    type: 'random'
                }
            });
        };

        const backEmitter = createEmitter(false);
        backEmitter.setDepth(0);
        this.backElement = backEmitter;

        const frontEmitter = createEmitter(true);
        frontEmitter.setDepth(10); // Ensure it's on top of planet (usually depth 1)
        this.frontElement = frontEmitter;

        if (this.planet.hidden ?? true) {
            this.setVisible(false);
        }
    }
}
