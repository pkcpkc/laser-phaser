import Phaser from 'phaser';
import type { PlanetData } from '../planet-data';
import type { IPlanetEffect } from '../planet-effect';
import { type BaseSurfaceStructureConfig } from './base-surface-structure-effect';

export interface GlimmeringSnowConfig extends BaseSurfaceStructureConfig {
    type: 'glimmering-snow';
    color?: number;
}

/**
 * Creates a glimmering snow effect for the White Moon.
 * Consists of drifting snow particles and surface glimmers.
 */
export class GlimmeringSnowEffect implements IPlanetEffect {
    public static readonly effectType = 'glimmering-snow';

    private scene: Phaser.Scene;
    private planet: PlanetData;
    private config: GlimmeringSnowConfig;
    private updateListener: () => void;

    private snowEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private glimmerEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, planet: PlanetData, config: GlimmeringSnowConfig) {
        this.scene = scene;
        this.planet = planet;
        this.config = config;

        this.createEmitters();

        // Create update listener (even if empty, for consistency and future use)
        this.updateListener = () => this.onUpdate();
        this.scene.events.on('update', this.updateListener);

        // Initial visibility based on planet hidden state
        if (this.planet.hidden ?? true) {
            this.setVisible(false);
        }
    }

    private createEmitters() {
        // if (!this.planet.gameObject) return;

        const scale = this.planet.visualScale || 1.0;
        const planetDepth = 1; // Default planet depth

        // Tint Config
        const tint = this.config.color ?? 0xffffff;

        // 1. Snow Emitter - Drifting particles (Atmospheric)
        this.snowEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: [tint],
            alpha: { start: 0.6, end: 0 },
            scale: { min: 0.1 * scale, max: 0.3 * scale },
            lifespan: { min: 2000, max: 4000 },
            frequency: 300, // Frequent small snow
            speed: 0, // Static
            gravityY: 0, // No gravity
            blendMode: 'ADD',
            emitZone: {
                source: {
                    getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
                        const centerX = this.planet.x;
                        const centerY = this.planet.y;
                        const radius = 30 * scale; // Slightly outside surface for atmosphere

                        // Random emission
                        const r = radius * Math.sqrt(Math.random());
                        const theta = Math.random() * 2 * Math.PI;

                        point.x = centerX + r * Math.cos(theta);
                        point.y = centerY + r * Math.sin(theta);
                        return point;
                    }
                },
                type: 'random'
            }
        });
        this.snowEmitter.setDepth(planetDepth + 0.1);

        // 2. Glimmer Emitter - Sparkles on the surface
        this.glimmerEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: [tint], // Use configured tint
            lifespan: { min: 300, max: 800 },
            scale: { start: 0.1 * scale, end: 0 },
            frequency: 100,
            stopAfter: 0,
            blendMode: 'SCREEN',
            emitZone: {
                source: {
                    getRandomPoint: (point: Phaser.Types.Math.Vector2Like) => {
                        const centerX = this.planet.x;
                        const centerY = this.planet.y;
                        const radius = 24 * scale; // Strictly inside

                        const r = radius * Math.sqrt(Math.random());
                        const theta = Math.random() * 2 * Math.PI;

                        point.x = centerX + r * Math.cos(theta);
                        point.y = centerY + r * Math.sin(theta);
                        return point;
                    }
                },
                type: 'random'
            }
        });
        this.glimmerEmitter.setDepth(planetDepth + 0.2);
    }

    private onUpdate() {
        // Skip update if planet is hidden
        if (this.planet.hidden ?? true) {
            return;
        }

        if (!this.planet.gameObject) return;
    }

    public setVisible(visible: boolean) {
        if (this.snowEmitter) {
            this.snowEmitter.setVisible(visible);
            if (visible && this.snowEmitter.start) this.snowEmitter.start();
            else if (!visible && this.snowEmitter.stop) this.snowEmitter.stop();
        }
        if (this.glimmerEmitter) {
            this.glimmerEmitter.setVisible(visible);
            if (visible && this.glimmerEmitter.start) this.glimmerEmitter.start();
            else if (!visible && this.glimmerEmitter.stop) this.glimmerEmitter.stop();
        }
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.snowEmitter?.destroy();
        this.glimmerEmitter?.destroy();
    }
}
