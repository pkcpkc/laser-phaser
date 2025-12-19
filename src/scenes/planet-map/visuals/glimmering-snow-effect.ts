import Phaser from 'phaser';
import type { PlanetData } from '../planet-registry';

/**
 * Creates a glimmering snow effect for the White Moon.
 * Consists of drifting snow particles and surface glimmers.
 */
export class GlimmeringSnowEffect {
    private scene: Phaser.Scene;
    private planet: PlanetData;
    private updateListener: () => void;

    private snowEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private glimmerEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor(scene: Phaser.Scene, planet: PlanetData) {
        this.scene = scene;
        this.planet = planet;

        this.createEmitters();

        this.updateListener = () => this.update();
        this.scene.events.on('update', this.updateListener);
    }

    private createEmitters() {
        if (!this.planet.gameObject) return;

        const scale = this.planet.visualScale || 1.0;
        const planetDepth = 1; // Default planet depth

        // Tint Config
        const tint = this.planet.glimmeringSnow?.color ?? 0xffffff;

        // 1. Snow Emitter - Drifting particles (Atmospheric)
        this.snowEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: [tint],
            alpha: { start: 0.6, end: 0 },
            scale: { start: 0.04 * scale, end: 0 },
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

    private update() {
        if (!this.planet.gameObject) return;
    }

    public setVisible(visible: boolean) {
        if (this.snowEmitter) {
            this.snowEmitter.setVisible(visible);
            if (visible) this.snowEmitter.start();
            else this.snowEmitter.stop();
        }
        if (this.glimmerEmitter) {
            this.glimmerEmitter.setVisible(visible);
            if (visible) this.glimmerEmitter.start();
            else this.glimmerEmitter.stop();
        }
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.snowEmitter?.destroy();
        this.glimmerEmitter?.destroy();
    }
}
