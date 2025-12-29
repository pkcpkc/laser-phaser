import Phaser from 'phaser';

/**
 * Color configuration for thruster effects.
 * Each layer has an array of two colors for gradient effect.
 */
export interface ThrusterColorConfig {
    outer: [number, number];  // Background flame
    core: [number, number];   // Middle flame
    inner: [number, number];  // Brightest center
    sparks: [number, number]; // Trailing sparks
}



/**
 * Configuration for thruster effects including colors and dimensions.
 */
export interface ThrusterConfig extends ThrusterColorConfig {
    lengthScale?: number; // Scaling factor for flame length (default: 1.0)
}

/**
 * Base thruster effect class. Creates particle emitters for engine exhaust.
 * Colors are configurable via the ThrusterColorConfig interface.
 */
export class ThrusterEffect {
    protected scene: Phaser.Scene;
    protected module: Phaser.GameObjects.Image;
    protected emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
    protected updateListener: () => void;

    constructor(
        scene: Phaser.Scene,
        module: Phaser.GameObjects.Image,
        config: ThrusterConfig
    ) {
        this.scene = scene;
        this.module = module;

        this.createEmitters(config);

        this.updateListener = () => this.update();
        this.scene.events.on('update', this.updateListener);

        this.module.on('destroy', this.destroy, this);
    }

    protected createEmitters(config: ThrusterConfig) {
        const lengthScale = config.lengthScale ?? 1.0;

        const createCallback = (minSpeed: number, maxSpeed: number, spread: number) => {
            return (particle: Phaser.GameObjects.Particles.Particle) => {
                if (!this.module || !this.module.active) return;

                const rotation = this.module.rotation;
                const angleDeg = Phaser.Math.RadToDeg(rotation);
                const emitAngleDeg = angleDeg;
                const emitAngleRad = Phaser.Math.DegToRad(emitAngleDeg);

                // Random spread
                const spreadRad = Phaser.Math.DegToRad(Phaser.Math.Between(-spread, spread));
                const finalAngle = emitAngleRad + spreadRad;

                const speed = Phaser.Math.Between(minSpeed, maxSpeed);

                particle.velocityX = Math.cos(finalAngle) * speed;
                particle.velocityY = Math.sin(finalAngle) * speed;
            };
        };

        // Outer Flame - Larger, Slower (Background)
        const outerEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: config.outer,
            alpha: { start: 0.5, end: 0 },
            scale: { start: 0.4, end: 0.1 },
            lifespan: { min: 400 * lengthScale, max: 600 * lengthScale },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 30,
            emitting: true,
            emitCallback: createCallback(100, 200, 10)
        });
        this.emitters.push(outerEmitter);

        // Core Flame - Small, Fast (Middle)
        const coreEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: config.core,
            alpha: { start: 1, end: 0 },
            scale: { start: 0.25, end: 0.05 },
            lifespan: { min: 300 * lengthScale, max: 500 * lengthScale },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 20,
            emitting: true,
            emitCallback: createCallback(200, 300, 5)
        });
        this.emitters.push(coreEmitter);

        // Inner Flame - Smallest, Brightest (Foreground)
        const innerEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: config.inner,
            alpha: { start: 1, end: 0 },
            scale: { start: 0.15, end: 0.05 },
            lifespan: { min: 300 * lengthScale, max: 500 * lengthScale },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 20,
            emitting: true,
            emitCallback: createCallback(250, 350, 2)
        });
        this.emitters.push(innerEmitter);

        // Sparks - Tiny trailing particles
        const sparkEmitter = this.scene.add.particles(0, 0, 'flare-white', {
            color: config.sparks,
            alpha: { start: 1, end: 0 },
            scale: { start: 0.1, end: 0 },
            lifespan: { min: 400 * lengthScale, max: 800 * lengthScale },
            blendMode: 'ADD',
            quantity: 1,
            frequency: 100,
            emitting: true,
            emitCallback: createCallback(200, 400, 15)
        });
        this.emitters.push(sparkEmitter);

        this.emitters.forEach(e => e.setDepth(100));
    }

    protected update() {
        if (this.module.active) {
            this.emitters.forEach(e => {
                if (!e.emitting) e.start();
            });
        }

        // Manual Position Sync (Anti-Culling)
        const x = this.module.x;
        const y = this.module.y;
        this.emitters.forEach(e => {
            e.setPosition(x, y);
            e.setDepth(100);
        });
    }

    public destroy() {
        this.scene.events.off('update', this.updateListener);
        this.emitters.forEach(e => {
            if (e.active) e.destroy();
        });
        this.emitters = [];
    }
}
